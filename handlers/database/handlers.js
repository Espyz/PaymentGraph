const { v4: uuidv4 } = require('uuid');

async function handlerget(client) {
    let data
    try {
        const {rows} = await client.query('SELECT * FROM todos')
        console.log(rows)
        data = {
            message: rows,
            statusCode: 200,
        }
        return data
    } catch (err){
        throw new Error(err)
    }
}
async function handlerpost(client, reply, request) {
    const {name, important, dueDate} = request.body
    const id = uuidv4()
    const done = false
    const createdAt = new Date().toISOString()
    let data
    try {
        const query = {
            text: `INSERT INTO todos (id, name, "createdAt", important, "dueDate", done)
                                        VALUES($1, $2, $3, $4, $5, $6 ) RETURNING *`,
            values: [id, name, createdAt, important, dueDate, done],
        }

            const {rows} = await client.query(query)
            console.log(rows[0])
            data = {
                created: true,
                statusCode: 200
            }
    } catch (err) {
        data = {
            created: false,
            statusCode: 400
        }
    }
    return data
}
async function handlerpatch(client, request) {
    const {important, dueDate, done, id} = request.body
    let data
    try{
        const query = {
            text:  `UPDATE todos SET 
                                    important = COALESCE($1, important), 
                                    "dueDate" = COALESCE($2, "dueDate"), 
                                    done = COALESCE($3, done) 
                                    WHERE id = $4 RETURNING *`,
            values : [important, dueDate, done, id]
        }
            const {rows} = await client.query(query)
            data = {
                message: rows[0],
                statusCode: 200
            }
    } catch (err) {
        data = {
            message: 'Error 400 unsupported operand type',
            statusCode: 400
        }
    }
    return data
}
async function handlerdelete(client, request){
    let data
    console.log(request.params)
    try {
        const {rows} = await client.query('DELETE FROM todos WHERE id = $1 RETURNING *', [request.params.id])
        data = {
            message: rows[0],
            statusCode: 200
        }
    } catch(err) {
        data = {
            message: 'Error 404 not Found',
            statusCode: 404
        }
    }
    return data
}

module.exports = {
    handlerget: handlerget,
    handlerpost: handlerpost,
    handlerpatch: handlerpatch,
    handlerdelete: handlerdelete
}
