const ExcelJS = require('exceljs')
async function testDate(date){
    return date.getDay() === 0 || date.getDay() === 6 || ((date.getDate() === 1 || date.getDate() === 2 || date.getDate() === 3 || date.getDate() === 4 || date.getDate() === 5 || date.getDate() === 7)
        && date.getMonth() === 1) || (date.getDate() === 23 && date.getMonth() === 2) || (date.getDate() === 8 && date.getMonth() === 3) || ((date.getDate() === 1 || date.getDate() === 9) &&
        date.getMonth() === 5) || (date.getDate() === 12 && date.getMonth() === 6) || (date.getDate() === 4 && date.getMonth() === 11);

}

async function Remainder(credit, time, data){
    let credits = credit
    if (credits > 0) {
        if (credit * 100 > Math.ceil(time/30.5)) {
            for (let i = 0; i < Math.ceil(time/30.5); i++) {
                // try {
                    credits = +(+credits - 0.01).toFixed(2)
                    data.message[i][0] = +(data.message[i][0] + 0.01).toFixed(2)
                // } catch (err){console.log('1')}
            }
        } else {
            for (let i = 0; i < credit * 100; i++) {
                // try {
                    credits = +(+credits - 0.01).toFixed(2)
                    data.message[i][0] = +(data.message[i][0] + 0.01).toFixed(2)
                // } catch (err) {
                //     console.log(i)
                // }
            }
        }
    } else {
        if (-(credit * 100) > Math.ceil(time/30.5)) {
            for (let i = Math.ceil(time/30.5) - 1; i >= 0; i--) {
                // try {
                    credits = +(+credits + 0.01).toFixed(2)
                    data.message[i][0] = +(data.message[i][0] - 0.01).toFixed(2)
                // } catch (err){console.log(3)}
            }
        } else {
            for (let i = ((-(credit * 100)) - 1).toFixed(); i >= 0; i--) {
                // try {
                    credits = +(+credits + 0.01).toFixed(2)
                    data.message[i][0] = +(data.message[i][0] - 0.01).toFixed(2)
                // } catch(err) {console.log('4')}
            }
        }
    }
    return credits
}

async function Annuity(credit, percent, equal, id, times, client, datesS, credits){
    let fact_percent, date, percents, this_equal
    let data = {
        message: [],
    }
    let time = times
    let dates = new Date(datesS.getTime())
    let j = 0
    for (let i = 1; i <= time; i++) {
        datesS.setMonth(dates.getMonth() + 1)
        datesS.setDate(dates.getDate())
        let L = times*24*60*60*1000 >= (datesS - dates)
        if (L || credit < Math.ceil(equal/2)) {
            this_equal = equal
            dates.setMonth(dates.getMonth() + 1)
            percents = percent
            // while (await testDate(dates)) {
            //     dates.setDate(dates.getDate() + 1)
            //     percents += (percent - 1) / 30
            // }
            // if (percent !== percents) {
            //     this_equal = +(credits * ((percents - 1) / (1 - Math.pow(percents, -time)))).toFixed(2)
            // }
            date = dates.toISOString()
            fact_percent = +((credit * (percents - 1)).toFixed(2))
            if (L) {
                try {
                    if (id !== null) {
                        const query = {
                            text: `INSERT INTO annuity (id, credit, percent_rate, accrued_percent, date)
                                            VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                            values: [id, this_equal - fact_percent, +(((percent - 1) * 1200).toFixed(2)), fact_percent, date],
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
                } else {
                    while (credit !== 0) {
                        credit = await Remainder(credit, time, data)
                    }
                    break
                }
            }
            let checkedChange
            checkedChange = new Date(dates.getTime())
            checkedChange.setMonth(checkedChange.getMonth() - 1)
            times -= ((dates - checkedChange)/1000/60/60/24)
        } else {
            let last = await LastPayOther(credit, percent, times, dates, 'ann')
            if (id === null){
                data.message.push(last)
                break
            } else {
                const query = {
                    text: `INSERT INTO annuity (id, credit, percent_rate, accrued_percent, date)
                                            VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                    values: [id, last[0], (percent - 1) * 100, last[1], last[2]],
                }
                await client.query(query)
                data = {
                    message: 'complete',
                }
                break
            }
        }
    }
    return data
}

async function Diff(credit, percent, dif, times, id, client, datesS){
    let fact_percent, date, percents
    let data = {
        message: [],
    }
    let check = 0
    let time = times
    let dates = new Date(datesS.getTime())
    for (let i = 0; i < time; i++){
        datesS.setMonth(dates.getMonth() + 1)
        datesS.setDate(dates.getDate())
        let L = times*24*60*60*1000 >= (datesS - dates)
        if (L || credit < Math.ceil(dif/2)) {
            dates.setMonth(dates.getMonth() + 1)
            percents = percent

            while (await testDate(dates)) {
                dates.setDate(dates.getDate() + 1)
                percents += +(((percent - 1) / 30).toFixed(3))
                check += 1
            }
            date = dates.toISOString()
            fact_percent = +((credit * (percents - 1)).toFixed(2))
            if (L) {
                try {
                    if (id !== null) {
                        let query = {
                            text: `INSERT INTO differentiated (id, credit, percent_rate, date, accrued_percent)
                                        VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                            values: [id, dif, +(((percent - 1) * 1200).toFixed(2)), date, fact_percent],
                        }
                        await client.query(query)
                        data = {
                            message: 'complete',
                        }
                    } else {
                        data.message.push([dif, fact_percent, date])
                    }
                } catch (err) {
                }
                credit = +(credit - dif).toFixed(2)
                let checkedChange
                checkedChange = new Date(dates.getTime())
                checkedChange.setMonth(checkedChange.getMonth() - 1)
                times -= ((dates - checkedChange) / 1000 / 60 / 60 / 24)
            } else {
                while (credit !== 0) {
                    credit = await Remainder(credit, time, data)
                }
                break
            }
        } else {
            let last = await LastPayOther(credit, percent, times, dates, 'diff')
            if (id === null){
                data.message.push(last)
                break
            } else {
                let query = {
                    text: `INSERT INTO differentiated (id, credit, percent_rate, date, accrued_percent)
                                        VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                    values: [id, last[0], +(((percent - 1) * 1200).toFixed(2)), last[2], last[1]],
                }
                await client.query(query)
                data = {
                    message: 'complete',
                }
            }
        }
    }
    return data
}

async function LastPay(credits, percent, time, id, client, datesS, times){
    let date, percents, fact_percent
    let data = {
        message: [],
    }
    let credit = credits
    console.log(times)
    let dates = new Date(datesS.getTime())
    for (let i = 1; i <= time; i++){
        datesS.setMonth(dates.getMonth() + 1)
        datesS.setDate(dates.getDate())
        if (i !== time) {
            dates.setMonth(dates.getMonth() + 1)
            percents = percent
            while (await testDate(dates)) {
                dates.setDate(dates.getDate() + 1)
                percents += +(((percent - 1) / 30).toFixed(3))
            }

            date = dates.toISOString()
            fact_percent = +((credit * (percents - 1)).toFixed(2))

            try {
                if (id !== null) {
                    if (i === time) {
                        const query = {
                            text: `INSERT INTO lastmonthpay (id, credit, percent_rate, accrued_percent, date)
                                        VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                            values: [id, credits, +(((percent - 1) * 1200).toFixed(2)), fact_percent, date]
                        }
                        await client.query(query)
                    } else {
                        const query = {
                            text: `INSERT INTO lastmonthpay (id, credit, percent_rate, accrued_percent, date)
                                        VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                            values: [id, 0, (percent - 1) * 100, fact_percent, date]
                        }
                        await client.query(query)
                        data = {
                            message: 'complete',
                        }
                    }
                } else if (i === time) {
                    data.message.push([credits, fact_percent, date])
                    break
                } else {
                    data.message.push([0, fact_percent, date])
                }
            } catch (err) {console.log('error in LastPay')}
            credit = +(credit + fact_percent).toFixed(2)
            let checkedChange
            checkedChange = new Date(dates.getTime())
            checkedChange.setMonth(checkedChange.getMonth() - 1)
            times -= ((dates - checkedChange)/1000/60/60/24)
        } else {
            let last = await LastPayOther(credit, percent, times, dates, 'last')
            last[0] = credits
            console.log(last)
            if (id === null){
                data.message.push(last)
                break
            } else {
                const query = {
                    text: `INSERT INTO lastmonthpay (id, credit, percent_rate, accrued_percent, date)
                                        VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                    values: [id, credits, (percent - 1) * 100, last[1], last[2]]
                }
                await client.query(query)
                data = {
                    message: 'complete',
                }
                break
            }
        }
    }
    return data
}

async function LastPayOther(credits, percent, time, dates, ty){
    let credit = credits
    percent = Math.pow(percent, (1/30))
    for (let i = 0; i < time; i++){
        credit = +(credit*percent).toFixed(2)
        dates.setDate(dates.getDate() + 1)
    }
    console.log(credits, percent, ty)
    return [credits, +(credit- credits).toFixed(2), dates.toISOString()]
}

async function handlerget1(client, id){
    let data = {
        message: 'Error',
        statusCode: 400
    }
    try {
        const {rows} = await client.query(`SELECT credit, accrued_percent, date FROM annuity WHERE id = '${String(id)}'`)
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
    // let work_percent = +(Math.pow((1+ percent/100), (1/12)).toFixed(3))
    // let work_percent = 1 + (+percent/12/100)
    // let equal = Math.round((credit * ((work_percent ** time) * (percent/100)) / (work_percent ** time - 1)) / 12)
    // let equal = Math.ceil(((((1+(percent/100))**(1/12))**time) / (((1+(percent/100))**(1/12))**time - 1)) * (((1+(percent/100))**(1/12)) - 1) * credit)
    // let equal = +((credit * (((work_percent - 1) * Math.pow(work_percent,time).toFixed(3)) / (Math.pow(work_percent, time).toFixed(3)- 1))).toFixed(2))
    let test_month_count = new Date(+credit_date)
    let date = new Date(+credit_date)
    test_month_count.setDate(test_month_count.getDate()+time)
    let years = test_month_count.getFullYear() - date.getFullYear()
    let month = test_month_count.getMonth() - date.getMonth()
    let new_test = new Date(test_month_count.getTime())
    let month_count = years*12 + month
    new_test.setMonth(new_test.getMonth() - month_count)
    if ((new_test - date) > 0){
        month_count++
    }
    console.log(month_count)
    let work_percent = +(percent / (100 * 12)).toFixed(3)
    let equal = +(credit * (work_percent / (1 - Math.pow(1 + work_percent, -month_count)))).toFixed(2)
    work_percent++
    let dif = +((credit / month_count).toFixed(2))
    let payout = {message: []}
    if (id === null){
        payout.message.push((await Annuity(credit, work_percent, equal, id, time, client, date, credit)).message)
        payout.message.push((await Diff(credit, work_percent, dif, time, id, client, date)).message)
        payout.message.push((await LastPay(credit, work_percent, month_count, id, client, date, time)).message)
    } else if (typed === 'ann') {
        payout.message.push((await Annuity(credit, work_percent, equal, id, time, client, date)).message)
    } else if (typed === 'dif'){
        payout.message.push((await Diff(credit, work_percent, dif, time, id, client, date)).message)
    } else if (typed === 'last'){
        payout.message.push((await LastPay(credit, work_percent, month_count, id, client, date, time)).message)
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
    const workbook = new ExcelJS.Workbook()
    const sheet1 = workbook.addWorksheet('Annuity')
    const sheet2 = workbook.addWorksheet('Different')
    const sheet3 = workbook.addWorksheet('LastMonthPay')
    sheet1.columns = [{header: 'Основной долг', key: 'credit', width : 100},
                      {header: 'Начисленные проценты', key: 'percent', width : 100},
                      {header: 'Дата', key: 'date', width : 100}]

    sheet2.columns = [{header: 'Основной долг', key: 'credit', width : 100},
                      {header: 'Начисленные проценты', key: 'percent', width : 100},
                      {header: 'Дата', key: 'date', width : 100}]

    sheet3.columns = [{header: 'Основной долг', key: 'credit', width : 100},
                      {header: 'Начисленные проценты', key: 'percent', width : 100},
                      {header: 'Дата', key: 'date', width : 100}]

    for (let i = 0; i < Math.ceil(time / 30.5); i++){
        sheet1.addRow(payout.message[0][i]).commit()
        sheet2.addRow(payout.message[1][i]).commit()
        sheet3.addRow(payout.message[2][i]).commit()
    }
    payout.buffer =  await workbook.xlsx.writeBuffer()
    return payout
}


module.exports = {
    handlerget1: handlerget1,
    handlerget2: handlerget2,
    handlerget3: handlerget3,
    handlerpost: handlerpost
}
