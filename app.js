'use strict'

const fastify = require('fastify')({
  logger: true
})

const dbconnector = require('./databases/testdb')
fastify.register(dbconnector)

const route = require('./routes/database/routes')
fastify.register(route)

const payRoute =  require('./routes/PayGraph/routes')
fastify.register(payRoute)

async function start() {
  try{
    await fastify.listen({port:3001, host:'::'})
  } catch(err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
