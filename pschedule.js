// Вывод средств заемщиком
const { requestBalanceStatus, projectsNoClosedDocuments, projectStatus } = require('app/services/constants');
const { helpers, sendError, pushMQTT } = require('app/dependes');
const { sub: mSub, mAdd } = require('sinful-math');
const { referralProgramResolver } = require('app/handlers/referrals/handler');
console.log('loan_issue')
//Уведомление в случае успеха или нет, нужен userId
let reqBalanceId = null
try {
    await client.query('BEGIN');
    let resultProperty = await client.query('SELECT property FROM bankoperation WHERE uuid = $1', [ originuuid ]);
    if(resultProperty.rows.length > 0)
    {
        reqBalanceId = resultProperty.rows[0].property
        let projectId = null;
        let objForBotLoanIssue = {};
        let checkBanks = {
            success:         false, // Если TRUE, то проверка прошла успешно
            allBanksSuccess: false, // Если TRUE, то это значит ответил последний банк и можно выполнять операции разноса/распределения и др. (все банки УСПЕШНО)
            allBanksFailed:  false, // Если TRUE, то это значит не ответил последний банк или все банки ответили с ошибкой
            waitAnotherBank: false, // Если TRUE, то значит ответил первый банк и надо ждать оставшийся банк. Операции разноса/распределения и др. делать не нужно!
            message:         '',
            messageTelegram: '',
        };
        
        if(meta && ('data' in meta))
        {
            let amaunt = parseFloat(meta.data.amount) // сумма платежа по текущему банку (по которому status_notification)
            let totalAmount = parseFloat(meta.data.totalAmount); // общая сумма, сохраняется в каждой банковской операции, если их по одному выводу средств было несколько (нужно её использовать, т.к. если операций несколько, amount будет неверным)
            let profileId = meta.data.profile
            projectId = meta.data.project
            let userId = meta.data.user
            let telegramMessage = '';
            
            checkBanks = await checkResBanksAndMoveNext(originuuid, is_success, reqBalanceId, meta, bankId, typeOper, client);
            console.log('status_notification, loan_issue: checkResBanksAndMoveNext');
            console.log(JSON.stringify(checkBanks));
            
            if (checkBanks.success && checkBanks.allBanksSuccess) {
                // Если функция отработала и все банки ответили успехом
                console.log('status_notification, loan_issue: bank response success and this allBanksSuccess');
                let reqBalanceResult = await client.query('UPDATE requestbalance SET status = $2 WHERE id = $1', [ reqBalanceId, requestBalanceStatus.done ]);
                
                if (reqBalanceResult.rowCount > 0) {
                    let qInvestBalance = `UPDATE balance
                                                          SET "balanceInvestTotal" = "balanceInvestTotal" + subquery.s,
                                                              "balanceInvest" = "balanceInvest" + subquery.s,
                                                              "balanceFreeze" = "balanceFreeze" - subquery.s
                                                          FROM (SELECT SUM(pi.amaunt) AS s, pi."profileId" FROM projectinvests AS pi WHERE pi."projectId" = $1 GROUP BY pi."profileId") AS subquery
                                                          WHERE "balanceProfileId" = subquery."profileId"
                                                          RETURNING "balanceInvest","balanceFreeze"`;
                    let taks = parseFloat(meta.data.totalCommission)
                    let oldAmaunt = totalAmount + taks
                    let resultTaks = await client.query('INSERT INTO requestbalance(amaunt, operation, requisites, "projectId", type, "profileId", status) VALUES($1,$2,$3,$4,$5,$6,$7)', [ taks, 5, null, projectId, 2, profileId, 3 ]);
                    if(resultTaks.rowCount > 0)
                    {
                        client.query('INSERT INTO projectcreditors(amaunt, taks, sumall, "projectId") VALUES($1,$2,$3,$4)', [ totalAmount, taks, oldAmaunt, projectId ]);
                        console.log('UPDATE balance SET "balanceLoan" = "balanceLoan" + $1, "balanceWaitLoan" = "balanceWaitLoan" - $3 WHERE "balanceProfileId" = $2 RETURNING "balanceLoan", "balanceWaitLoan"', [ oldAmaunt, profileId, oldAmaunt ]);
                        result = await client.query('UPDATE balance SET "balanceLoan" = "balanceLoan" + $1, "balanceWaitLoan" = "balanceWaitLoan" - $3 WHERE "balanceProfileId" = $2 RETURNING "balanceLoan", "balanceWaitLoan"', [ oldAmaunt, profileId, oldAmaunt ]);
                        if(result.rowCount > 0 && result.rows.length > 0)
                        {
                            let newBalance = result.rows[0].balanceLoan
                            let waitLoan = result.rows[0].balanceWaitLoan
                            
                            let resUpdBalS = await client.query(`UPDATE balancesources
                                                                                 SET "sourceAmount" = "sourceAmount" - subquery."srcA",
                                                                                     "sourceBlocked" = "sourceBlocked" - subquery."srcA",
                                                                                     "destinationAmount" = "destinationAmount" - subquery."destA",
                                                                                     "destinationBlocked" = "destinationBlocked" - subquery."destA"
                                                                                 FROM (SELECT pitb."balanceId" as "balId", pitb."sourceAmount" as "srcA", pitb."destinationAmount" as "destA"
                                                                                       FROM projectinveststotalbanks AS pitb
                                                                                       WHERE pitb."projectId" = $1) AS subquery
                                                                                 WHERE "balanceId" = subquery."balId"`, [ projectId ]);
                            
                            if (resUpdBalS.rowCount > 0) {
                                let resultProject = await client.query('UPDATE projects SET "projectStatus" = 3, "projectDateGiveLoan" = NOW(), "projectDateDeadline" = (NOW() + "projectTime" * (INTERVAL \'1\' DAY)) WHERE "projectId" = $1 RETURNING "projectDateGiveLoan", "projectDateDeadline", "projectRate", "projectSum", "projectTime", "targetId", "annuityType"', [ projectId ]);
                                //let resultProject = await client.query('select "projectDateGiveLoan", "projectDateDeadline", "projectRate", "projectSum" from projects where "projectId" = $1', [projectId])
                                if(resultProject.rowCount > 0)
                                    //if(resultProject.rows.length > 0)
                                {
                                    await client.query(qInvestBalance, [projectId])
                                    /////////////////////////////////////////////////////////
                                    //Формирования графика платежей для каждого инвестора и в целом
                                    //Дата выдачи и определить кол-во дней и платежей
                                    
                                    // ------------------------------------------------------------------------------------------------------------------------
                                    // TODO: КОД НИЖЕ ИСПОЛЬЗУЕТСЯ В ПРЕВЬЮ ГРАФИКА ПЛАТЕЖЕЙ. ЕСЛИ КТО-ТО ДЕЛАЕТ ИЗМЕНЕНИЯ НИЖЕ, ТО ОПОВЕСТИТЕ!!!!!!!!!!!!!!!!!!
                                    let projectTarg = resultProject.rows[0].targetId
                                    let anuitent = resultProject.rows[0].annuityType
                                    let flagGos = !(helpers.checkIsAnnuitent(anuitent, projectTarg))
                                    
                                    let projectDateGiveLoan = resultProject.rows[0].projectDateGiveLoan //new Date(1614913618 * 1000)
                                    let projectDateDeadline = resultProject.rows[0].projectDateDeadline //new Date(1620443218 * 1000)
                                    let bm = projectDateGiveLoan.getMonth() + 1
                                    //let em = projectDateDeadline.getMonth()+1
                                    let bd = projectDateGiveLoan.getDate()
                                    let ed = projectDateDeadline.getDate()
                                    let by = projectDateGiveLoan.getFullYear()
                                    let paymentSchedule = []
                                    let projectRate = resultProject.rows[0].projectRate
                                    let projectSum = resultProject.rows[0].projectSum
                                    let projectTime = resultProject.rows[0].projectTime
                                    console.log(projectDateGiveLoan, projectDateDeadline)
                                    let m = monthDiff(projectDateGiveLoan, projectDateDeadline)
                                    console.log('m:'+m)
                                    if (m === 0) {
                                        let day = dayDiff(projectDateGiveLoan, projectDateDeadline)
                                        paymentSchedule.push({'date': projectDateDeadline, 'days': day})
                                    }
                                    else {
                                        // TODO: убрал т.к. сделал + 1 в monthDiff
                                        // if ((ed > bd)) m++;
                                        //TODO: Если разница в днях меньше чем разница между днями т.е. 03.02 и 01.03 и при этом разница в месяцах составляет 1
                                        if(ed < bd && m === 1)
                                        {
                                            let day = dayDiff(projectDateGiveLoan, projectDateDeadline)
                                            paymentSchedule.push({'date': projectDateDeadline, 'days': day})
                                        }
                                        else
                                        {
                                            //TODO: Если разница в днях меньше чем разница между днями т.е. 03.02 и 01.04 и при этом разница в месяцах составляет больше 1
                                            if(ed < bd && m > 1) m--;
                                            for (let i = 0; i < m; i++) {
                                                bm++
                                                if (bm % 13 === 0) {
                                                    bm = 1;
                                                    by++
                                                }
                                                console.log(projectDateGiveLoan)
                                                //console.log(by, bm, projectDateGiveLoan.getDate())
                                                let resultDate = newDate(by, bm, projectDateGiveLoan.getDate())
                                                console.log(by, bm, resultDate)
                                                paymentSchedule.push({'date': new Date(resultDate), 'days': 0})
                                                let pre;
                                                if(i === 0) pre = projectDateGiveLoan
                                                else pre = paymentSchedule[i-1].date
                                                //console.log(paymentSchedule[i].date, pre)
                                                let day = dayDiff(paymentSchedule[i].date, pre)
                                                paymentSchedule[i].days = day
                                                if (i === m-1) {
                                                    day = dayDiff(projectDateDeadline, paymentSchedule[i].date)
                                                    if(day !== 1) paymentSchedule.push({'date': projectDateDeadline, 'days': day-1})
                                                    //paymentSchedule[m].days = day-1
                                                }
                                            }
                                        }
                                    }
                                    for (let obj of paymentSchedule) {
                                        //console.log(obj.date, obj.days)
                                    }
                                    projectRate = projectRate / 100
                                    let resultInvest = await client.query(`SELECT SUM(income)::double precision AS income,
                                                                                                  SUM(amaunt)::double precision AS amaunt,
                                                                                                  b."balanceId",
                                                                                                  up."companyId",
                                                                                                  bio."bioIsSelfEmployed"
                                                                                           FROM projectinvests AS pi
                                                                                                    INNER JOIN balance AS b ON b."balanceProfileId" = pi."profileId"
                                                                                                    INNER JOIN userprofile AS up ON up."id" = pi."profileId"
                                                                                                    INNER JOIN users u ON up."userId" = u."userId"
                                                                                                    INNER JOIN bio ON u."bioId" = bio."bioId"
                                                                                           WHERE pi."projectId" = $1
                                                                                           GROUP BY b."balanceId", up."companyId", bio."bioIsSelfEmployed"`, [ projectId ]);
                                    //Если хоть один инвестор не сохранился (целостность)
                                    let integrity = true
                                    let payoff = 0.00
                                    let iter = 1
                                    let sum = 0.00
                                    let sumNDFLProject = 0.00
                                    let allDays = paymentSchedule.length
                                    let lastAmaunt = 0.00
                                    let stablePay = 0.00
                                    if(!flagGos)
                                    {
                                        console.log(projectSum, projectRate, projectTime, allDays)
                                        //TODO: Вставить месяц а не дни
                                        stablePay = parseFloat( ((projectSum*((projectRate)/(12)))/(1-Math.pow((1+(projectRate)/(12)),-allDays))).toFixed(3).slice(0, -1))
                                        console.log('stablePay: ', stablePay)
                                    }
                                    const allInvestors = {}
                                    for (let item of paymentSchedule) {
                                        let s = 0.00
                                        let sa = 0.00
                                        let sumNDFL = 0.00
                                        let ri = 0
                                        for (let obj of resultInvest.rows) {
                                            let a = 0.00
                                            let inc = 0.00
                                            let bid = obj.balanceId
                                            let incomeInMonth = 0.00
                                            let diffAmaunt = 0.00
                                            let NDFL = 0.00
                                            let withNDFL = 0.00
                                            let withoutNDFL = 0.00
                                            let ph = true
                                            if(obj.companyId)
                                            {
                                                ph =false
                                            }
                                            if (ph && obj.bioIsSelfEmployed) {
                                                ph =false
                                            }
                                            try {
                                                a = obj.amaunt
                                                inc = obj.income
                                                incomeInMonth = parseFloat(((a * item.days * projectRate) / 365).toFixed(3).slice(0, -1))
                                                
                                                //21.04
                                                if(!flagGos)
                                                {
                                                    if(iter === 1)
                                                    {
                                                        resultInvest.rows[ri].originalAmaunt = resultInvest.rows[ri].amaunt
                                                        resultInvest.rows[ri].stablePay = parseFloat( ((resultInvest.rows[ri].amaunt*((projectRate)/(12)))/(1-Math.pow((1+(projectRate)/(12)),-allDays))).toFixed(3).slice(0, -1))
                                                        if (isNaN(resultInvest.rows[ri].stablePay)) {
                                                            resultInvest.rows[ri].stablePay = 0
                                                        }
                                                        console.log(bid, resultInvest.rows[ri].stablePay)
                                                    }
                                                    //Дифференцированный платеж
                                                    //diffAmaunt = parseFloat(((resultInvest.rows[ri].originalAmaunt * item.days) / projectTime).toFixed(3).slice(0, -1))
                                                    //Аннуитетный платеж
                                                    diffAmaunt = mSub(resultInvest.rows[ri].stablePay, incomeInMonth)
                                                    //Уменьшаю amaunt для ануитентного платежа
                                                    //TODO: Последний месяц тут может быть минус проверяй
                                                    resultInvest.rows[ri].amaunt = mSub(resultInvest.rows[ri].amaunt, diffAmaunt)
                                                    
                                                }
                                                
                                                //Последний месяц
                                                if(iter === allDays)
                                                {
                                                    let diff = 0.00
                                                    if(flagGos)
                                                    {
                                                        if(iter === 1)
                                                        {
                                                            //Остаток копеек или рублей
                                                            diff = incomeInMonth
                                                        }
                                                        else
                                                        {
                                                            //Остаток копеек или рублей
                                                            diff = mAdd(incomeInMonth, resultInvest.rows[ri].sum)
                                                        }
                                                        diff = mSub(inc, diff)
                                                        //TODO: Остаок из=за этой формулы parseFloat(((a * item.days * projectRate) / 365).toFixed(3).slice(0, -1))
                                                        //может быть минус
                                                        incomeInMonth = mAdd(incomeInMonth, diff)
                                                    }
                                                    diffAmaunt = mAdd(diffAmaunt, resultInvest.rows[ri].amaunt)
                                                    //if(diff > 0) incomeInMonth = mAdd(incomeInMonth, diff)
                                                    //else if(diff < 0) incomeInMonth = mAdd(incomeInMonth, diff)
                                                }
                                                console.log(incomeInMonth, diffAmaunt)
                                                if(!('sum' in resultInvest.rows[ri]))
                                                {
                                                    resultInvest.rows[ri].sum = incomeInMonth
                                                }
                                                else
                                                {
                                                    resultInvest.rows[ri].sum = mAdd(incomeInMonth, resultInvest.rows[ri].sum)
                                                }
                                                //console.log('-----')
                                                //console.log(resultInvest.rows[ri].sum)
                                            } catch (e) {
                                                console.error(e)
                                                incomeInMonth = 0.00
                                            }
                                            s = mAdd(s, incomeInMonth)
                                            //Последний месяц добавляем amaunt для не аннуитентного платежа
                                            if(flagGos)
                                            {
                                                if(iter === allDays) lastAmaunt = a
                                            }
                                            else
                                            {
                                                //Добавляем каждый месяц amaunt на кол-во дней
                                                lastAmaunt = diffAmaunt
                                                sa = mAdd(sa, diffAmaunt)
                                            }
                                            if(ph)
                                            {
                                                NDFL = Math.round(incomeInMonth * nd)
                                                sumNDFL += NDFL
                                            }
                                            payoff = mSub(incomeInMonth, NDFL)
                                            //TODO: Полученный доход по каждому инвестору
                                            if(bid in allInvestors)
                                            {
                                                allInvestors[bid] = mAdd(allInvestors[bid], payoff)
                                            }
                                            else
                                            {
                                                allInvestors[bid] = payoff
                                            }
                                            payoff = mAdd(payoff, lastAmaunt)
                                            let resultInvestPays = await client.query('INSERT INTO investpays("month", income, "datePay", amaunt, "projectId", "balanceId", "NDFL", "payoff") VALUES($1,$2,$3,$4,$5,$6,$7,$8)', [ iter, incomeInMonth, item.date, lastAmaunt, projectId, bid, NDFL, payoff ]);
                                            if (resultInvestPays.rowCount === 0) {
                                                integrity = false
                                                break
                                            }
                                            ri++
                                        }
                                        sum = mAdd(sum, s)
                                        sumNDFLProject = mAdd(sumNDFLProject, sumNDFL)
                                        if (integrity) {
                                            let psa = 0.00
                                            if(flagGos)
                                            {
                                                if(iter === allDays) psa = projectSum
                                            }
                                            else
                                            {
                                                //Добавлям amaunt для ауитетного платежа
                                                psa = sa
                                            }
                                            //TODO: вычетать amaunt из payoff
                                            payoff = mSub(s, sumNDFL)
                                            payoff = mAdd(payoff, psa)
                                            let resultPaymentSchedule = await client.query('INSERT INTO paymentschedule("projectId", "date", "days", "month", "sumIncome", income, amaunt, "NDFL", payoff) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)', [ projectId, item.date, item.days, iter, sum, s, psa, sumNDFL, payoff ]);
                                            if (resultPaymentSchedule.rows === 0) {
                                                integrity = false
                                                break
                                            }
                                            iter++
                                        }
                                        
                                    }
                                    if (!integrity) {
                                        //await client.query('ROLLBACK')
                                        console.log('investpays save all error')
                                        sendError('loan_issue', 'investpays, не все записи сохранились')
                                    }
                                    //balanceWait update
                                    console.log('allInvestors')
                                    console.log(allInvestors)
                                    let qInvestBalanceWait = `UPDATE balance
                                                                              SET "balanceWait" = "balanceWait" + subquery.s
                                                                              FROM (SELECT SUM(income) - SUM("NDFL") AS s, ip."balanceId" AS bid, SUM(amaunt) AS "amaunt"
                                                                                    FROM investpays AS ip
                                                                                    WHERE ip."projectId" = $1
                                                                                    GROUP BY ip."balanceId") AS subquery
                                                                              WHERE "balanceId" = subquery."bid"
                                                                              RETURNING "balanceId", "balanceWait"`;
                                    let updBalances = await client.query(qInvestBalanceWait, [ projectId ]);
                                    if(updBalances.rowCount > 0) {
                                        //TODO: Сгенерировать график платежей в виде документа и сохранить его, уведомить об этом заёмщика, дать скачать его отдельный маршрут
                                        let updateProject = await client.query('UPDATE projects SET "projectDebtSumAll" = "projectSum" + $3, "projectOverPayment" = $3, "projectNDFL" = $1, "payoff" = "projectSum" + $3 - $1 WHERE "projectId" = $2 RETURNING "projectPlatformRules", CASE WHEN "projectPlatformRules" > 8 AND "projectStatus" IN (3, 4, 5, 6, 7, 13) AND NOT "projectId" = ANY($4) THEN TRUE ELSE FALSE END AS "hasProjectCloseDocuments"', [ sumNDFLProject, projectId, sum, projectsNoClosedDocuments ]);
                                        if(updateProject.rowCount > 0)
                                        {
                                            let projectPlatformRules = null
                                            let hasProjectCloseDocuments = false;
                                            if (updateProject.rows[0]) {
                                                projectPlatformRules = updateProject.rows[0].projectPlatformRules;
                                                hasProjectCloseDocuments = updateProject.rows[0].hasProjectCloseDocuments
                                            }
                                            let project = {projectId, projectStatus: 3, projectPlatformRules: projectPlatformRules, hasProjectCloseDocuments: hasProjectCloseDocuments}
                                            
                                            pushMQTT([ 'invest' ], JSON.stringify({
                                                action: 'update',
                                                type:   'changeStatusProject',
                                                meta:   project,
                                            }));
                                            
                                            //TODO: object.requestBalanceId, object.status
                                            pushMQTT([ '9yEBj1tqkUWRyDNhEOe' ], projectId + '#3');
                                            
                                            pushMQTT([ 'admins/739968cab1314fbf', 'info/' + userId ], JSON.stringify({
                                                action: 'update',
                                                type:   'changeStatusRequestBalance',
                                                meta:   {
                                                    profileId:     profileId,
                                                    status:        3,
                                                    rbid:          reqBalanceId,
                                                    newBalance:    newBalance,
                                                    waitLoan:      waitLoan,
                                                    balanceFreeze: null,
                                                    balanceInvest: null,
                                                    type:          2,
                                                },
                                            }));
                                            
                                            e = false;
                                            
                                            objForBotLoanIssue = {
                                                service: 'notification',
                                                channel: null,
                                                data:    {
                                                    profileId:    profileId,
                                                    type:         'loan_issue',
                                                    placeholders: {
                                                        value:         projectSum,
                                                        projectId:     projectId,
                                                        projectStatus: projectStatus.loanIssued,
                                                    },
                                                },
                                            };
                                            
                                            sendError('loan_issue', 'Вывод средств заёмщиком выполнен');
                                        }
                                    }
                                }
                            }
                            else {
                                sendError('status_notification_error', '❗ Банк(и) одобрили вывод средств, но не удалось распределить деньги на платформе;')
                            }
                        }
                    }
                    else
                    {
                        sendError('status_notification_error', 'Вывод средств не удался; Возврат средств не удался;')
                    }
                }
                else {
                    sendError('status_notification_error', 'Заёмщик. Вывод средств не удался, статус заявки не обновился.');
                }
            }
            else if (checkBanks.success && checkBanks.waitAnotherBank) {
                // Если функция отработала и был сохранен первый банк из 2х
                console.log('status_notification, loan_issue: bank response success and need to wait response from another bank');
                e = false;
            }
            else if (checkBanks.success && checkBanks.allBanksFailed) {
                // Если функция отработала и оба банка провалились
                console.log('status_notification, loan_issue: bank response failed and another bank also failed');
                
                let reqBalanceResult = await client.query('UPDATE requestbalance SET status = $2 WHERE id = $1', [ reqBalanceId, requestBalanceStatus.refuse ]);
                
                if (reqBalanceResult.rowCount > 0) {
                    e = false;
                    pushMQTT([ 'admins/739968cab1314fbf', 'info/' + userId ], JSON.stringify({
                        action: 'update',
                        type:   'changeStatusRequestBalance',
                        meta:   {
                            profileId:     profileId,
                            status:        2,
                            rbid:          reqBalanceId,
                            newBalance:    null,
                            waitLoan:      null,
                            balanceFreeze: null,
                            balanceInvest: null,
                            type:          2,
                        },
                    }));
                    sendError('status_notification_error', `❗ Вывод средств заёмщиком отказано (uuid ${ originuuid })`);
                }
                else {
                    sendError('status_notification_error', `❗ Заёмщик. Вывод средств не удался, статус заявки не обновился (uuid ${ originuuid })`);
                }
            }
            else {
                console.log('status_notification, loan_issue: bank response success, but handled it with error');
                telegramMessage = `\n❗ Не удалось проверить ответ от банка на его статус. Ошибка: `;
            }
            
            if (checkBanks.messageTelegram.length > 0) {
                telegramMessage += checkBanks.messageTelegram;
            }
            
            sendError('status_notification_error', originuuid + '\n\n' + telegramMessage);
        }
        if(e) {
            await client.query('ROLLBACK')
            sendError('status_notification_error', `❗ Заёмщик. Что-то пошло не так (uuid ${ originuuid })`)
        }
        else
        {
            await client.query('COMMIT')
            
            if (checkBanks.success && checkBanks.allBanksSuccess) {
                try {
                    // Делаем запрос к боту для того, чтобы отправить письмо заёмщику и документы, и обновить данные в битриксе
                    pushMQTT([ 'admins/739968cab1314fbf' ], JSON.stringify(objForBotLoanIssue));
                }
                catch(err) {
                    console.log('status_notification/loan_issue: ERROR MQTT loan issue');
                    console.log(err.message, err.stack);
                }
                
                try {
                    // Делаем запрос к боту для того, чтобы отправить данные в БКИ по выдаче проекта
                    pushMQTT([ 'admins/739968cab1314fbf' ], JSON.stringify({
                        service: 'payment_schedule_add',
                        channel: null,
                        data:    {
                            projectId: projectId,
                            uuid:      originuuid,
                        },
                    }));
                }
                catch(err) {
                    console.log('status_notification/loan_issue: ERROR MQTT payment schedule add');
                    console.log(err.message, err.stack);
                }
                
                try {
                    // Реферальная программа. Делаем после завершения успешного коммита транзакции выше
                    // Это будет вторая транзакция
                    
                    const dataForFunction = {
                        projectId: projectId,
                    };
                    
                    let resPayment = await referralProgramResolver(dataForFunction, client);
                    console.log(`status_notification/loan_issue: результат работы функции по формированию выплат за рефералов`);
                    console.log(resPayment);
                    
                    if (resPayment.telegramMessage) {
                        sendError('loan_issue', resPayment.telegramMessage);
                    }
                }
                catch(err) {
                    console.log(`status_notification/loan_issue/referralProgramResolver: ERROR`);
                    console.log(err.message, err.stack);
                    sendError('loan_issue', `Произошла ошибка при работе с рефералами и инвесторами во время выдачи займа, попала в собственный <code>catch</code>!. Вызовите заново через отдельный метод. \nОшибка: ${ err.message }.`);
                }
            }
        }
    }
    else
    {
        sendError('status_notification_error', `❗ reqBalanceId не найден; Операция не обновилась; uuid ${ originuuid }`)
        await client.query('ROLLBACK')
    }
}
catch (exp) {
    e = true
    console.log(exp)
    sendError('status_notification_error', `❗ При выдаче займа произошла ошибка (пришел ответ от точки или ошибка при обработке выдачи) (uuid ${ originuuid })`);
    await client.query('ROLLBACK')
}
