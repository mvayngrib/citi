const querystring = require('querystring')
const crypto = require('crypto')
const typeforce = require('typeforce')
const extend = require('xtend')
// const thunky = require('thunky')
const Client = require('node-rest-client').Client
const uuid = require('uuid')
const low = require('lowdb')
const pick = require('object.pick')
const types = require('./types')

module.exports = function (opts) {
  typeforce({
    client_id: typeforce.String,
    client_secret: typeforce.String,
    db: typeforce.String
  }, opts)

  const client_id = opts.client_id
  const client_secret = opts.client_secret
  const client = new Client()
  const db = low('db.json', { storage: require('lowdb/lib/file-async') })
  db.defaults({
      credentials: {},
      applications: {}
    })
    .value()

  const api = {
    applications: getApplications,
    application: getApplication,
    products,
    createUnsecuredCreditApplication,
    screenUnsecuredCreditApplication,
    requestCreditApplicationDecision
  }

  return api

  function callMethod ({ url, scope, args, verb="GET"}, cb) {
    getClientCredentials(scope, function (err, credentials) {
      if (err) return cb(err)

      verb = verb.toLowerCase()
      args = prepArgs(args, credentials)
      cb = wrapCB(cb)
      client[verb](url, args, cb)
    })
  }

  function prepArgs (args={}, credentials) {
    const extended = {
      headers: extend({
        Authorization: 'Bearer ' + credentials.access_token,
        uuid: uuid.v4(),
        Accept: 'application/json',
        client_id: client_id
      }, args.headers || {})
    }

    if (args.data) extended.data = args.data

    return extended
  }

  function wrapCB (cb) {
    return function (data, response) {
      if (response.statusCode !== 200) {
        const err = Buffer.isBuffer(data) ? data.toString() : JSON.stringify(data)
        return cb(new Error(err))
      }

      cb(null, data)
    }
  }


  function getClientCredentials (scope, cb) {
    const credentials = db
      .get('credentials')
      .find({ scope: scope })
      .value()

    if (credentials) {
      return process.nextTick(() => cb(null, credentials))
    }

    getNewClientCredentials(scope, function (err, credentials) {
      if (err) return cb(err)

      db.set('credentials.' + scope, credentials)
        .value()

      cb(null, credentials)
    })
  }

  function getNewClientCredentials (scope, cb) {
    client.post("https://sandbox.apihub.citi.com/gcb/api/clientCredentials/oauth2/token/sg/gcb", {
      headers: {
        Accept: 'application/json',
        "Content-Type": 'application/x-www-form-urlencoded',
        "Authorization": 'Basic ' + new Buffer(client_id + ':' + client_secret).toString('base64')
      },
      data: querystring.stringify({
        grant_type: "client_credentials",
        scope: scope
      })
    }, wrapCB(cb))
  }

  function products (start, cb) {
    if (typeof start === 'function') {
      cb = start
      start = 0
    }

    callMethod({
      url: "https://sandbox.apihub.citi.com/gcb/api/v1/apac/onboarding/products",
      verb: "GET",
      scope: '/api',
      args: {
        headers: {
          nextStartIndex: start || 0
        }
      }
    }, function (err, result) {
      if (err) return cb(err)

      const products = result.products
      products.forEach(p => {
        if (p.organisation) {
          p.organization = p.organisation
          delete p.organisation
        }
      })

      cb(null, products)
    })
  }

  function createUnsecuredCreditApplication (opts, cb) {
    typeforce({
      productType: types.productType,
      product: types.product,
      applicant: types.applicant
    }, opts)

    const { productType, product, applicant } = opts
    const data = {
      applicant,
      product: {
        [productType]: pick(product, 'productCode', 'sourceCode', 'organization', 'logo')
      }
    }

    callMethod({
      url: "https://sandbox.apihub.citi.com/gcb/api/v1/apac/onboarding/products/unsecured/applications",
      verb: "POST",
      scope: '/api',
      args: {
        data: JSON.stringify(data)
      }
    }, function (err, application) {
      if (err) return cb(err)

      db.set(getAppKey(application), extend(application, data))
        .value()

      cb(null, application)
    })
  }

  function getApplications (cb) {
    process.nextTick(() => cb(null, getApplicationsSync()))
  }

  function getApplication (id, cb) {
    const app = getApplicationSync(id)
    process.nextTick(() => {
      if (app) {
        cb(null, app)
      } else {
        cb(new Error('application not found'))
      }
    })
  }

  function getApplicationsSync () {
    return db.get('applications').value()
  }

  function getApplicationSync (id) {
    return db.get(getAppKey(id)).value()
  }

  function screenUnsecuredCreditApplication (applicationId, cb) {
    const application = getApplicationSync(applicationId)
    if (!application) {
      return process.nextTick(() => cb(new Error('application not found in database')))
    }

    if (application.applicationStage) {
      // already screened
      return process.nextTick(() => {
        cb(null, {
          applicationStage: application.applicationStage
        })
      })
    }

    callMethod({
      url: `https://sandbox.apihub.citi.com/gcb/api/v1/apac/onboarding/products/unsecured/applications/${applicationId}/backgroundScreening`,
      verb: "POST",
      scope: '/api',
      args: {
        data: JSON.stringify({
          controlFlowId: application.controlFlowId
        })
      }
    }, function (err, result) {
      if (err) return cb(err)

      updateApp(applicationId, result)
      cb(null, result)
    })
  }

  function requestCreditApplicationDecision (applicationId, cb) {
    const application = getApplicationSync(applicationId)
    if (!application) {
      return process.nextTick(() => cb(new Error('application not found in database')))
    }

    // if (application.applicationStage) {
    //   // already screened
    //   return process.nextTick(() => {
    //     cb(null, {
    //       applicationStage: application.applicationStage
    //     })
    //   })
    // }

    callMethod({
      url: `https://sandbox.apihub.citi.com/gcb/api/v1/apac/onboarding/products/unsecured/applications/${applicationId}/inPrincipleApprovals`,
      verb: "POST",
      scope: '/api',
      args: {
        data: JSON.stringify({
          controlFlowId: application.controlFlowId
        })
      }
    }, function (err, result) {
      if (err) return cb(err)

      updateApp(application, result)
      cb(null, result)
    })
  }

  function updateApp (application, update) {
    const id = getApplicationId(application)
    saveApp(id, extend(application, update))
  }

  function saveApp (id, val) {
    db.set(getAppKey(id), val)
      .value()
  }
}

function getAppKey (application) {
  return 'applications.' + getApplicationId(application)
}

function getApplicationId (application) {
  return typeof application === 'string' ? application : application.applicationId
}
