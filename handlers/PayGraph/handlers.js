async function testDate(date){
    return date.getDay() === 0 || date.getDay() === 6 || ((date.getDate() === 1 || date.getDate() === 2 || date.getDate() === 3 || date.getDate() === 4 || date.getDate() === 5 || date.getDate() === 7)
        && date.getMonth() === 1) || (date.getDate() === 23 && date.getMonth() === 2) || (date.getDate() === 8 && date.getMonth() === 3) || ((date.getDate() === 1 || date.getDate() === 9) &&
        date.getMonth() === 5) || (date.getDate() === 12 && date.getMonth() === 6) || (date.getDate() === 4 && date.getMonth() === 11);

}

async function Remainder(credit, time, data){
    let credits = credit
    // console.log(credit)
    if (credits > 0) {
        if (credit * 100 > time) {
            for (let i = 0; i < time; i++) {
                credits = +(+credits - +0.01).toFixed(2)
                data.message[i][0] = +(data.message[i][0] + 0.01).toFixed(2)
            }
        } else {
            for (let i = 0; i < credit * 100; i++) {
                credits = +(+credits - +0.01).toFixed(2)
                data.message[i][0] = +(data.message[i][0] + 0.01).toFixed(2)
            }
        }
    } else {
        if ( -(credit * 100) > time) {
            for (let i = time - 1; i >= 0; i--) {
                credits = +(+credits + +0.01).toFixed(2)
                data.message[i][0] = +(data.message[i][0] - 0.01).toFixed(2)
            }
        } else {
            for (let i = (-(credit * 100)) - 1; i >= 0; i--) {
                credits = +(+credits + +0.01).toFixed(2)
                data.message[i][0] = +(data.message[i][0] - 0.01).toFixed(2)
            }
        }
    }
    return credits
}

async function Annuity(credit, percent, equal, id, time, client, dates, credits){
    let fact_percent, date, percents, this_equal
    let data = {
        message: [],
    }
    for (let i = 1; i <= time; i++) {
        this_equal = equal
        dates.setMonth(dates.getMonth() + 1)
        percents = percent
        // while (await testDate(dates)) {
        //     dates.setDate(dates.getDate() + 1)
        //     percents += (percent - 1) / 30
        // }
        // if (percent !== percents) {
        //     this_equal = +(credits * ((percents - 1) / (1 - Math.pow(percents, -time)))).toFixed(2)
        //     console.log(this_equal)
        // }
        date = dates.toISOString()
        fact_percent = +((credit * (percents - 1)).toFixed(2))
        if (i < time) {
            try {
                if (id !== null) {
                    const query = {
                        text: `INSERT INTO annuity (id, credit, percent_rate, accrued_percent, date)
                                            VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                        values: [id, this_equal - fact_percent, +(((percent-1)*1200).toFixed(2)), fact_percent, date],
                    }
                    await client.query(query)
                    data = {
                        message: 'complete',
                    }
                } else {
                    data.message.push([+(this_equal - fact_percent).toFixed(2), fact_percent, date])
                }
            } catch (err) {
            }
            credit = +((+((credit * percents).toFixed(2)) - this_equal).toFixed(2))
        } else {
            if (id !== null) {
                credit = +((+((credit * percents).toFixed(2)) - this_equal).toFixed(2))
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
                    // credit = +((+((credit * percents).toFixed(2)) - this_equal).toFixed(2))
                    // data.message.push([this_equal - fact_percent, fact_percent , date], [credit, 0, date])
                // data.message.push([credit, +(equal-credit).toFixed(2), date])
                // credit = 0
                credit = +((+((credit * percents).toFixed(2)) - this_equal).toFixed(2))
                data.message.push([+(this_equal - fact_percent).toFixed(2), fact_percent , date])
                while (credit !== 0){
                    credit = await Remainder(credit, time, data)
                }
                }
        }
        // console.log(i)
    }
    console.log(credit, ' ', fact_percent, ' ', this_equal, 'What?')
    return data
}

async function Diff(credit, percent, dif, time, id, client, dates){
    let fact_percent, date, percents
    let data = {
        message: [],
    }
    let check = 0
    for (let i = 0; i < time; i++){

        dates.setMonth(dates.getMonth() + 1)
        percents = percent

        while (await testDate(dates)) {
            dates.setDate(dates.getDate() + 1)
            percents += +(((percent - 1) / 30).toFixed(3))
            check += 1
        }
        date = dates.toISOString()
        fact_percent = +((credit * (percents-1)).toFixed(2))
        try {
            if (id !== null) {
                let query = {
                    text: `INSERT INTO differentiated (id, credit, percent_rate, date, accrued_percent)
                                        VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                    values: [id, dif, +(((percent-1)*1200).toFixed(2)), date, fact_percent],
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
        // console.log(credit)
    }
    console.log(check)
    return data
}

async function LastPay(credits, percent, time, id, client, dates){
    let date, percents, fact_percent
    let data = {
        message: [],
    }
    let credit = credits
    for (let i = 1; i <= time; i++){

        dates.setMonth(dates.getMonth() + 1)
        percents = percent
        while (await testDate(dates)) {
            dates.setDate(dates.getDate() + 1)
            percents += +(((percent - 1) / 30).toFixed(3) )
        }

        date = dates.toISOString()
        fact_percent = +((credit * (percents-1)).toFixed(2))

        try {
            if (id !== null) {
                if (i === time) {
                    const query = {
                        text: `INSERT INTO lastmonthpay (id, credit, percent_rate, accrued_percent, date)
                                        VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                        values: [id, credits, +(((percent-1)*1200).toFixed(2)), fact_percent, date]
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
    // console.log(id)
    try {
        const {rows} = await client.query(`SELECT credit, accrued_percent, date FROM annuity WHERE id = '${String(id)}'`)
        // console.log(rows)
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
        // console.log(rows)
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
        // console.log(rows)
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
    // console.log({credit, percent, time, credit_date, typed, id})
    // let work_percent = +(Math.pow((1+ percent/100), (1/12)).toFixed(3))
    // let work_percent = 1 + (+percent/12/100)
    // let equal = Math.round((credit * ((work_percent ** time) * (percent/100)) / (work_percent ** time - 1)) / 12)
    // console.log(work_percent)
    // let equal = Math.ceil(((((1+(percent/100))**(1/12))**time) / (((1+(percent/100))**(1/12))**time - 1)) * (((1+(percent/100))**(1/12)) - 1) * credit)
    // let equal = +((credit * (((work_percent - 1) * Math.pow(work_percent,time).toFixed(3)) / (Math.pow(work_percent, time).toFixed(3)- 1))).toFixed(2))
    // console.log(equal)
    let work_percent = +(percent / (100 * 12)).toFixed(3)
    let equal = +(credit * (work_percent / (1 - Math.pow(1 + work_percent, -time)))).toFixed(2)
    work_percent++
    let dif = +((credit / time).toFixed(2))
    // console.log(dif)
    let payout = {message: []}
    if (id === null){
        payout.message.push((await Annuity(credit, work_percent, equal, id, time, client, new Date(+credit_date), credit)).message)
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
    // console.log(payout)

    return payout
}

module.exports = {
    handlerget1: handlerget1,
    handlerget2: handlerget2,
    handlerget3: handlerget3,
    handlerpost: handlerpost
}