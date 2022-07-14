async function testDate(date){
    if (date.getDay() === 0 || date.getDay() === 6 || ((date.getDate() === 1 || date.getDate() === 2 || date.getDate() === 3 || date.getDate() === 4 || date.getDate() === 5 || date.getDate() === 7)
        && date.getMonth() === 1) || (date.getDate() === 23 && date.getMonth() === 2) || (date.getDate() === 8 && date.getMonth() === 3) || ((date.getDate() === 1 || date.getDate() === 9) &&
            date.getMonth() === 5) || (date.getDate() === 12 && date.getMonth() === 6) || (date.getDate() === 4 && date.getMonth() === 11)){
        return true
    }
    return false
}

async function Annuity(credit, percent, equal, id, time, client, dates){
    let fact_percent, date, percents, this_equal
    let data = {
        message: [],
    }
    for (let i = 1; i <= time; i++) {
        this_equal = equal
        dates.setMonth(dates.getMonth() + 1)
        percents = percent
        while (await testDate(dates)) {
            dates.setDate(dates.getDate() + 1)
            percents += (percent - 1) / 30
        }
        // if (percent !== percents){
        //     this_equal = null
        // }
        date = dates.toISOString()
        fact_percent = Math.round(credit * (percents - 1))
        if (i < time) {
            try {
                if (id !== null) {
                    const query = {
                        text: `INSERT INTO annuity (id, credit, percent_rate, accrued_percent, date)
                                            VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                        values: [id, this_equal - fact_percent, (percent - 1) * 100, fact_percent, date],
                    }
                    await client.query(query)
                    data = {
                        message: 'complete',
                    }
                } else {
                    data.message.push([this_equal - fact_percent, fact_percent, date])
                }
            } catch (err) {
            }
            credit = Math.round(credit * percents) - this_equal
        } else {
            if (id !== null) {
                credit = Math.round(credit * percents) - this_equal
                const query = {
                    text: `INSERT INTO annuity (id, credit, percent_rate, accrued_percent, date)
                                            VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                    values: [id, this_equal - fact_percent + credit, (percent - 1) * 100, fact_percent - credit, date],
                }
                await client.query(query)
                data = {
                    message: 'complete',
                }
            }else {
                    credit = Math.round(credit * percents) - this_equal
                    data.message.push([this_equal - fact_percent + credit, fact_percent, date])
                }
        }
        console.log(credit, ' ', fact_percent, ' ', this_equal)
    }
    return data
}

async function Diff(credit, percent, dif, time, id, client, dates){
    let fact_percent, date, percents
    let data = {
        message: [],
    }

    for (let i = 0; i < time; i++){

        dates.setMonth(dates.getMonth() + 1)
        percents = percent

        while (await testDate(dates)) {
            dates.setDate(dates.getDate() + 1)
            percents = (percent - 1) / 30 + percent
        }
        date = dates.toISOString()
        fact_percent = Math.round(credit * (percents-1))
        try {
            if (id !== null) {
                let query = {
                    text: `INSERT INTO differentiated (id, credit, percent_rate, date, accrued_percent)
                                        VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                    values: [id, dif, (percent - 1) * 100, date, fact_percent],
                }
                await client.query(query)
                data = {
                    message: 'complete',
                }
            } else {
                data.message.push([dif, fact_percent, date])
            }
        } catch (err) {}
        credit -= dif
    }
    return data
}

async function LastPay(credits, percent, time, id, client, dates){
    let date, percents, fact_percent
    let data = {
        message: [],
    }
    let credit = credits
    for (let i = 0; i < time; i++){

        dates.setMonth(dates.getMonth() + 1)
        percents = percent
        while (await testDate(dates)) {
            dates.setDate(dates.getDate() + 1)
            percents = (percent - 1) / 30 + percent
        }

        date = dates.toISOString()
        fact_percent = Math.ceil(credit * (percents-1))

        try {
            if (id !== null) {
                if (i === time) {
                    const query = {
                        text: `INSERT INTO lastmonthpay (id, credit, percent_rate, accrued_percent, date)
                                        VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                        values: [id, credits, (percent - 1) * 100, fact_percent, date]
                    }
                    await client.query(query)
                } else {
                    const query = {
                        text: `INSERT INTO lastmonthpay (id, credit, percent_rate, accrued_percent, date)
                                        VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                        values: [id, 0, (percent - 1) * 100, fact_percent, date]
                    }
                    await client.query(query)
                }

                data = {
                    message: 'complete',
                }
            } else if (i === time){
                data.message.push([credits, fact_percent, date])
            } else {
                data.message.push([0, fact_percent, date])
            }
        } catch (err){console.log(err)}
        credit += fact_percent
    }
    return data
}

async function handlerget1(client, id){
    let data = {
        message: 'Error',
        statusCode: 400
    }
    console.log(id)
    try {
        const {rows} = await client.query(`SELECT credit, accrued_percent, date FROM annuity WHERE id = '${String(id)}'`)
        console.log(rows)
        data = {
            message: rows,
            statusCode: 200,
        }
    } catch (err){
        throw new Error(err)
    }
    return data
}

async function handlerget2(client, id){
    let data = {
        message: 'Error',
        statusCode: 400
    }
    try {
        const {rows} = await client.query(`SELECT credit, accrued_percent, date FROM differentiated WHERE id = '${String(id)}'`)
        console.log(rows)
        data = {
            message: rows,
            statusCode: 200,
        }
    } catch (err){
        throw new Error(err)
    }
    return data
}

async function handlerget3(client, id){
    let data = {
        message: 'Error',
        statusCode: 400
    }
    try {
        const {rows} = await client.query(`SELECT credit, accrued_percent, date FROM lastmonthpay WHERE id = '${String(id)}'`)
        console.log(rows)
        data = {
            message: rows,
            statusCode: 200,
        }
    } catch (err){
        throw new Error(err)
    }
    return data
}

async function handlerpost(client, request){
    const {credit, percent, time, credit_date, typed, id} = request.body
    console.log({credit, percent, time, credit_date, typed, id})
    // let work_percent = (1+ percent/100) ** (1/12)
    let work_percent = 1 + (+percent/12/100)
    let equal = Math.round((credit * ((work_percent ** time) * (percent/100)) / (work_percent ** time - 1)) / 12)
    console.log(work_percent)
    // let equal = Math.ceil(((((1+(percent/100))**(1/12))**time) / (((1+(percent/100))**(1/12))**time - 1)) * (((1+(percent/100))**(1/12)) - 1) * credit)
    // let equal = Math.round(credit * (((work_percent - 1) * (work_percent ** time)) / ((work_percent ** time )- 1)))
    console.log(equal)
    let dif = Math.ceil(credit / time)
    let payout = {message: []}
    if (id === null){
        payout.message.push((await Annuity(credit, work_percent, equal, id, time, client, new Date(+credit_date))).message)
        payout.message.push((await Diff(credit, work_percent, dif, time, id, client, new Date(+credit_date))).message)
        payout.message.push((await LastPay(credit, work_percent, time, id, client, new Date(+credit_date))).message)
    } else if (typed === 'ann') {
        payout.message.push((await Annuity(credit, work_percent, equal, id, time, client, new Date(+credit_date))).message)
    } else if (typed === 'dif'){
        payout.message.push((await Diff(credit, work_percent, dif, time, id, client, new Date(+credit_date))).message)
    } else if (typed === 'last'){
        payout.message.push((await LastPay(credit, work_percent, time, id, client, new Date(+credit_date))).message)
    } else{
        payout.message.push('Payment type not selected')
    }
    if ((payout.message[1] !== [] && payout.message[2] !== [] && payout.message[0] !== [] && id === null) || (payout.message[0] !== 'Payment type not selected' && id !== null)){
        payout.statusCode = 200
    } else if (payout.message[0] === 'Payment type not selected'){
        payout.statusCode = 302
    } else {
        payout.statusCode = 400
    }
    console.log(payout)

    return payout
}

module.exports = {
    handlerget1: handlerget1,
    handlerget2: handlerget2,
    handlerget3: handlerget3,
    handlerpost: handlerpost
}