//
// async function Annuity(credit, percent, equal, id, time, client, dates){
//     let fact_percent, date, percents, this_equal
//     let data = {
//         message: [],
//     }
//     for (let i = 1; i <= time; i++) {
//         this_equal = equal
//         dates.setMonth(dates.getMonth() + 1)
//         percents = percent
//         // while (await testDate(dates)) {
//         //     dates.setDate(dates.getDate() + 1)
//         //     percents += (percent - 1) / 30
//         // }
//         // if (percent !== percents){
//         //     this_equal = null
//         // }
//         date = dates.toISOString()
//         fact_percent = +((credit * (percents - 1)).toFixed(2))
//         if (i < time) {
//             try {
//                 if (id !== null) {
//                     const query = {
//                         text: `INSERT INTO annuity (id, credit, percent_rate, accrued_percent, date)
//                                             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
//                         values: [id, this_equal - fact_percent, (percent - 1) * 100, fact_percent, date],
//                     }
//                     await client.query(query)
//                     data = {
//                         message: 'complete',
//                     }
//                 } else {
//                     data.message.push([+(this_equal - fact_percent).toFixed(2), fact_percent, date])
//                 }
//             } catch (err) {
//             }
//             credit = +((+((credit * percents).toFixed(2)) - this_equal).toFixed(2))
//         } else {
//             if (id !== null) {
//                 credit = +((+((credit * percents).toFixed(2)) - this_equal).toFixed(2))
//                 const query = {
//                     text: `INSERT INTO annuity (id, credit, percent_rate, accrued_percent, date)
//                                             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
//                     values: [id, this_equal - fact_percent + credit, (percent - 1) * 100, fact_percent - credit, date],
//                 }
//                 await client.query(query)
//                 data = {
//                     message: 'complete',
//                 }
//             }else {
//                 credit = +((+((credit * percents).toFixed(2)) - this_equal).toFixed(2))
//                 data.message.push([+(this_equal - fact_percent).toFixed(2), fact_percent , date])
//                 // console.log(data.message[0][0])
//                 while (credit !== 0){
//                     credit = await test(credit, time, data)
//                 }
//             }
//         }
//         // console.log(credit, ' ', fact_percent, ' ', this_equal, 'What?')
//     }
//     // console.log(data.message)
//     return data
// }
//
//
// async function suck(client, request){
//     const {credit, percent, time, credit_date, typed, id} = request
//     let work_percent = +(percent / (100 * 12)).toFixed(3)
//     let equal = +(credit * (work_percent / (1 - Math.pow(1 + work_percent, -time)))).toFixed(2)
//     work_percent++
//     let payout = {message: []}
//     if (id === null) {
//         payout.message.push((await Annuity(credit, work_percent, equal, id, time, client, new Date(+credit_date))).message)
//     }
//     // console.log(payout.message)
//     // console.log(payout.message[0].length)
// }
//
// suck(null, {credit: 6000000,
//                             percent:20,
//                             time: 60,
//                             credit_date:1657532163962,
//                             typed: null,
//                             id: null,
// })
Date_now = new Date()
Date_onlyNow = new Date
Date_over = (Date_now.setMonth(Date_now.getMonth() + 1))

console.log(Date_over - Date_onlyNow)