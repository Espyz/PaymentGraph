const fastifyPlugin = require('fastify-plugin')
const {Client} = require('pg')
const {values} = require("pg/lib/native/query");
const fastify = require("fastify");
require('dotenv').config
const client = new Client ({
    user: 'andreytruhar',
    password: '33215033q',
    host: 'localhost',
    port: 5432,
    database: 'values'
})
async function dbconnector(fastify, options){
    try {
        await client.connect()
        console.log('db connected succesfully')
        fastify.decorate('db',{client})
    } catch (err){
        console.error(err)
    }
}

module.exports = fastifyPlugin(dbconnector)
