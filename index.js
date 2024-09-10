const http = require('http');
const https = require('https');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const Docxtemplater = require('docxtemplater');
const PizZip = require('pizzip');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/docs', express.static('docs'));
app.use('/db', express.static('db'));

// Эндпоинт для генерации документов
app.post('/generate-contract', (req, res) => {
    const { formData } = req.body;

    let dogovorTags = {
        //Для документа
        items: formData.services,
        numberDate: formData.numberDate,
        contractNumber: formData.contractNumber,
        contractJustNumber: formData.contractJustNumber,
        writtenDate: formData.writtenDate,
        contractSubjectNom: formData.contractSubjectNom,
        contractSubjectGen: formData.contractSubjectGen,
        stoimostNumber: formData.stoimostNumber,
        writtenAmountAct: formData.writtenAmountAct,
        writtenAmountDogovor: formData.writtenAmountDogovor,
        contractEndDate: formData.contractEndDate,
        dogovorYear: new Date().getFullYear(),

        //Для наших ИП
        own_ip_fullName: formData.ip.fullName,
        own_ip_shortName: formData.ip.shortName,
        own_ip_basis: `действующий на основании ${formData.ip.basis}`,
        own_ip_ogrnip: formData.ip.ogrnip,
        own_ip_post: formData.ip.post,
        own_ip_initials: formData.ip.initials,
        own_ip_print: formData.ip.print.toLowerCase() == 'да' ? 'М.П.' : 'Б.П.',
        own_ip_fio: formData.ip.fio,
        own_ip_address: formData.ip.address,
        own_ip_inn: formData.ip.inn,
        own_ip_rs: formData.ip.rs,
        own_ip_bank: formData.ip.bank,
        own_ip_bik: formData.ip.bik,
        own_ip_ks: formData.ip.ks,
        own_ip_email: formData.ip.email,
        own_ip_phone: formData.ip.phone,
        own_ip_orgName: formData.ip.orgName,
        own_ip_requisites: `Адрес местонахождения: ${formData.ip.address}, ИНН: ${formData.ip.inn}, ОГРНИП: ${formData.ip.ogrnip}, Р/с: ${formData.ip.rs}, ${formData.ip.bank}, БИК: ${formData.ip.bik}, К/с: ${formData.ip.ks}, E-mail: ${formData.ip.email}, тел. ${formData.ip.phone}`,

        //Контрагенты
        contragent_fullName: formData.contragent.fullName,
        contragent_shortName: formData.contragent.type == 'Самозанятый' ? formData.contragent.fullName : formData.contragent.shortName,
        contragent_orgNameGen: formData.contragent.orgNameGen,
        contragent_directorFullNameGen: formData.contragent.directorFullNameGen,

        contragent_basis:
            formData.contragent.type == 'Гос' || formData.contragent.type == 'МСП' ? `действующей на основании ${formData.contragent.basis}` :
                formData.contragent.type == 'ИП' ? `действующей на основании ${formData.contragent.basis} ${formData.contragent.OGRNIP}` :
                    formData.contragent.type == 'Самозанятый' ? `${formData.contragent.basis} (паспорт серия ${formData.contragent.passportSeries} №${formData.contragent.passportNumber}, ИНН ${formData.contragent.INN})` : '',

        contragent_post: formData.contragent.post,
        contragent_initials: formData.contragent.initials,
        contragent_print: formData.contragent.print.toLowerCase() == 'да' ? 'М.П.' : 'Б.П.',
        contragent_directorName: formData.contragent.directorName,
        contragent_address: formData.contragent.address,
        contragent_INN: formData.contragent.INN,
        contragent_KPP: formData.contragent.KPP,
        contragent_OKTMO: formData.contragent.OKTMO,
        contragent_OKPO: formData.contragent.OKPO,
        contragent_OKOPF: formData.contragent.OKOPF,
        contragent_OGRN: formData.contragent.OGRN,
        contragent_OGRNIP: formData.contragent.OGRNIP,
        contragent_LSCH: formData.contragent.LSCH,
        contragent_RSCH: formData.contragent.RSCH,
        contragent_passportSeries: formData.contragent.passportSeries,
        contragent_passportNumber: formData.contragent.passportNumber,
        contragent_KSCH: formData.contragent.KSCH,
        contragent_NKAZCH: formData.contragent.NKAZCH,
        contragent_EKAZSCH: formData.contragent.EKAZSCH,
        contragent_bankName: formData.contragent.bankName,
        contragent_BIK: formData.contragent.BIK,
        contragent_OKOGU: formData.contragent.OKOGU,
        contragent_email: formData.contragent.email,
        contragent_phone: formData.contragent.phone,

        //Реквизиты
        contragent_requisites:
            formData.contragent.type == 'Гос'
                ?
                (formData.contragent.NKAZCH != '' && formData.contragent.EKAZSCH != '' && formData.contragent.LSCH != '')
                    ?
                    `Адрес местонахождения: ${formData.contragent.address}, ИНН: ${formData.contragent.INN}, КПП: ${formData.contragent.KPP}, ОКТМО: ${formData.contragent.OKTMO}, ОКАТО: ${formData.contragent.OKATO}, Номер казначейского счета: ${formData.contragent.NKAZCH}, Единый казначейский счет: ${formData.contragent.EKAZSCH}, ${formData.contragent.bankName}, БИК: ${formData.contragent.BIK}, Л/сч: ${formData.contragent.LSCH}, ОГРН: ${formData.contragent.OGRN}, ОКПО: ${formData.contragent.OKPO}, ОКОПФ: ${formData.contragent.OKOPF}, ОКОГУ: ${formData.contragent.OKOGU}, E-mail: ${formData.contragent.email}, тел. ${formData.contragent.phone}`
                    :
                    `Адрес местонахождения: ${formData.contragent.address}, ИНН: ${formData.contragent.INN}, КПП: ${formData.contragent.KPP}, ОКТМО: ${formData.contragent.OKTMO}, ОКАТО: ${formData.contragent.OKATO}, Р/СЧ: ${formData.contragent.RSCH}, К/СЧ: ${formData.contragent.KSCH}, ${formData.contragent.bankName}, БИК: ${formData.contragent.BIK}, ОГРН: ${formData.contragent.OGRN}, ОКПО: ${formData.contragent.OKPO}, ОКОПФ: ${formData.contragent.OKOPF}, ОКОГУ: ${formData.contragent.OKOGU}, E-mail: ${formData.contragent.email}, тел. ${formData.contragent.phone}`
                :
                formData.contragent.type == 'МСП'
                    ?
                    `Адрес местонахождения: ${formData.contragent.address}, ИНН: ${formData.contragent.INN}, ОГРН: ${formData.contragent.OGRN}, КПП: ${formData.contragent.KPP}, Р/с: ${formData.contragent.RSCH}, ${formData.contragent.bankName}, БИК: ${formData.contragent.BIK}, К/с: ${formData.contragent.KSCH}, E-mail: ${formData.contragent.email}, тел. ${formData.contragent.phone}`
                    :
                    formData.contragent.type == 'ИП'
                        ?
                        `Адрес местонахождения: ${formData.contragent.address}, ИНН: ${formData.contragent.INN}, ОГРНИП: ${formData.contragent.OGRNIP}, Р/с: ${formData.contragent.RSCH}, ${formData.contragent.bankName}, БИК: ${formData.contragent.BIK}, К/с: ${formData.contragent.KSCH}, E-mail: ${formData.contragent.email}, тел. ${formData.contragent.phone}`
                        :
                        formData.contragent.type == 'Самозанятый'
                            ?
                            `Адрес местонахождения: ${formData.contragent.address}, Паспорт ${formData.contragent.passportSeries} № ${formData.contragent.passportNumber} ИНН: ${formData.contragent.INN}, Р/с: ${formData.contragent.RSCH}, ${formData.contragent.bankName}, БИК: ${formData.contragent.BIK}, К/с: ${formData.contragent.KSCH}, тел. ${formData.contragent.phone}`
                            :
                            '',


        //Получатели услуг
        receiver_fullName: formData.receiver && formData.receiver.fullName,
        receiver_shortName: formData.receiver && (formData.receiver.type == 'Самозанятый' ? formData.receiver.fullName : formData.receiver.shortName),
        receiver_orgNameGen: formData.receiver && formData.receiver.orgNameGen,
        receiver_directorFullNameGen: formData.receiver && formData.receiver.directorFullNameGen,

        receiver_basis: formData.receiver &&
            (formData.receiver.type == 'Гос' || formData.receiver.type == 'МСП' ? `действующий на основании ${formData.receiver.basis}` :
                formData.receiver.type == 'ИП' ? `действующий на основании ${formData.receiver.basis} ${formData.receiver.OGRNIP}` :
                    formData.receiver.type == 'Самозанятый' ? `${formData.receiver.basis} (паспорт серия ${formData.receiver.passportSeries} №${formData.receiver.passportNumber}, ИНН ${formData.receiver.INN})` : ''),

        receiver_post: formData.receiver && formData.receiver.post,
        receiver_initials: formData.receiver && formData.receiver.initials,
        receiver_print: formData.receiver && (formData.receiver.print.toLowerCase() == 'да' ? 'М.П.' : 'Б.П.'),
        receiver_directorName: formData.receiver && formData.receiver.directorName,
        receiver_address: formData.receiver && formData.receiver.address,
        receiver_INN: formData.receiver && formData.receiver.INN,
        receiver_KPP: formData.receiver && formData.receiver.KPP,
        receiver_OKTMO: formData.receiver && formData.receiver.OKTMO,
        receiver_OKPO: formData.receiver && formData.receiver.OKPO,
        receiver_OKOPF: formData.receiver && formData.receiver.OKOPF,
        receiver_OGRN: formData.receiver && formData.receiver.OGRN,
        receiver_OGRNIP: formData.receiver && formData.receiver.OGRNIP,
        receiver_LSCH: formData.receiver && formData.receiver.LSCH,
        receiver_RSCH: formData.receiver && formData.receiver.RSCH,
        receiver_passportSeries: formData.receiver && formData.receiver.passportSeries,
        receiver_passportNumber: formData.receiver && formData.receiver.passportNumber,
        receiver_KSCH: formData.receiver && formData.receiver.KSCH,
        receiver_NKAZCH: formData.receiver && formData.receiver.NKAZCH,
        receiver_EKAZSCH: formData.receiver && formData.receiver.EKAZSCH,
        receiver_bankName: formData.receiver && formData.receiver.bankName,
        receiver_BIK: formData.receiver && formData.receiver.BIK,
        receiver_OKOGU: formData.receiver && formData.receiver.OKOGU,
        receiver_email: formData.receiver && formData.receiver.email,
        receiver_phone: formData.receiver && formData.receiver.phone,

        //Реквизиты
        receiver_requisites: formData.receiver &&
            (formData.receiver.type == 'Гос'
                ?
                (formData.receiver.NKAZCH != '' && formData.receiver.EKAZSCH != '' && formData.receiver.LSCH != '')
                    ?
                    `Адрес местонахождения: ${formData.receiver.address}, ИНН: ${formData.receiver.INN}, КПП: ${formData.receiver.KPP}, ОКТМО: ${formData.receiver.OKTMO}, ОКАТО: ${formData.receiver.OKATO}, Номер казначейского счета: ${formData.receiver.NKAZCH}, Единый казначейский счет: ${formData.receiver.EKAZSCH}, ${formData.receiver.bankName}, БИК: ${formData.receiver.BIK}, Л/сч: ${formData.receiver.LSCH}, ОГРН: ${formData.receiver.OGRN}, ОКПО: ${formData.receiver.OKPO}, ОКОПФ: ${formData.receiver.OKOPF}, ОКОГУ: ${formData.receiver.OKOGU}, E-mail: ${formData.receiver.email}, тел. ${formData.receiver.phone}`
                    :
                    `Адрес местонахождения: ${formData.receiver.address}, ИНН: ${formData.receiver.INN}, КПП: ${formData.receiver.KPP}, ОКТМО: ${formData.receiver.OKTMO}, ОКАТО: ${formData.receiver.OKATO}, Р/СЧ: ${formData.receiver.RSCH}, К/СЧ: ${formData.receiver.KSCH}, ${formData.receiver.bankName}, БИК: ${formData.receiver.BIK}, ОГРН: ${formData.receiver.OGRN}, ОКПО: ${formData.receiver.OKPO}, ОКОПФ: ${formData.receiver.OKOPF}, ОКОГУ: ${formData.receiver.OKOGU}, E-mail: ${formData.receiver.email}, тел. ${formData.receiver.phone}`
                :
                formData.receiver.type == 'МСП'
                    ?
                    `Адрес местонахождения: ${formData.receiver.address}, ИНН: ${formData.receiver.INN}, ОГРН: ${formData.receiver.OGRN}, КПП: ${formData.receiver.KPP}, Р/с: ${formData.receiver.RSCH}, ${formData.receiver.bankName}, БИК: ${formData.receiver.BIK}, К/с: ${formData.receiver.KSCH}, E-mail: ${formData.receiver.email}, тел. ${formData.receiver.phone}`
                    :
                    formData.receiver.type == 'ИП'
                        ?
                        `Адрес местонахождения: ${formData.receiver.address}, ИНН: ${formData.receiver.INN}, ОГРНИП: ${formData.receiver.OGRNIP}, Р/с: ${formData.receiver.RSCH}, ${formData.receiver.bankName}, БИК: ${formData.receiver.BIK}, К/с: ${formData.receiver.KSCH}, E-mail: ${formData.receiver.email}, тел. ${formData.receiver.phone}`
                        :
                        formData.receiver.type == 'Самозанятый'
                            ?
                            `Адрес местонахождения: ${formData.receiver.address}, Паспорт ${formData.receiver.passportSeries} № ${formData.receiver.passportNumber} ИНН: ${formData.receiver.INN}, Р/с: ${formData.receiver.RSCH}, ${formData.receiver.bankName}, БИК: ${formData.receiver.BIK}, К/с: ${formData.receiver.KSCH}, тел. ${formData.receiver.phone}`
                            :
                            ''),
    }

    const templateName = `templates/${formData.contractType}-side/contracts/${formData.template}.docx`;
    const templateContent = fs.readFileSync(templateName, 'binary');

    const zip = new PizZip(templateContent);
    const doc = new Docxtemplater(zip, {
        nullGetter(part) {
            if (part.value === undefined) {
                return "";
            }
            return part.value;
        }
    });

    doc.setData(dogovorTags);

    try {
        doc.render();
        const output = doc.getZip().generate({ type: 'nodebuffer' });

        const filename = `Договор №${formData.contractNumber} ${formData.receiver ?
            (formData.receiver.type == 'Самозанятый' ? formData.receiver.fullName : formData.receiver.shortName) :
            formData.contragent ?
                (formData.contragent.type == 'Самозанятый' ? formData.contragent.fullName : formData.contragent.shortName)
                : ''}.docx`;

        const filePath = `docs/${filename}`;

        fs.writeFileSync(filePath, output);

        // Чтение существующего JSON файла
        let documents = [];
        const jsonFilePath = 'db/documents.json';
        if (fs.existsSync(jsonFilePath)) {
            const jsonData = fs.readFileSync(jsonFilePath, 'utf-8');
            if (jsonData.trim().length > 0) {
                documents = JSON.parse(jsonData);
            }
        }

        // Добавление новой записи
        documents.push({
            filename: filename,
            filePath: filePath,
            data: formData,
            state: 'Создан'
        });

        // Запись в JSON файл
        fs.writeFileSync(jsonFilePath, JSON.stringify(documents, null, 2));

        // Работа с файлом ipName.json для увеличения lastDocNumber
        const ipFilePath = 'db/ipName.json';
        if (fs.existsSync(ipFilePath)) {
            const ipData = fs.readFileSync(ipFilePath, 'utf-8');
            let ipRecords = JSON.parse(ipData);

            // Поиск ИП по ФИО и увеличение lastDocNumber
            ipRecords.forEach(ip => {
                if (ip.fio === formData.ip.fio) {
                    ip.lastDocNumber = String((+ip.lastDocNumber || 0) + 1);
                }
            });

            // Запись обновленных данных обратно в файл
            fs.writeFileSync(ipFilePath, JSON.stringify(ipRecords, null, 2));
        }

        res.status(200).send(filename);
    } catch (error) {
        console.error('Ошибка при создании документа:', error);
        res.status(500).send('Ошибка при создании документа');
    }
});

// Эндпоинт для создания счета
app.post('/generate-expenses', (req, res) => {
    const { formData } = req.body;

    const jsonFilePath = 'db/documents.json';
    let documents = [];

    if (fs.existsSync(jsonFilePath)) {
        const jsonData = fs.readFileSync(jsonFilePath, 'utf-8');
        if (jsonData.trim().length > 0) {
            documents = JSON.parse(jsonData);
        }
    }

    const document = documents.find(doc => doc.filename === formData.contractName);

    if (!document) {
        return res.status(404).send('Договор не найден');
    }

    if (!document.expenses) {
        document.expenses = [];
    } ``

    let nomerScheta = document.data.ip.fio == 'Джатдоев Алим Сеит-Алиевич'
        ?
        `${document.data.contractNumber}-С${document.expenses.length + 1}`
        :
        document.data.ip.fio == 'Уртенов Азамат Заурович'
            ?
            `С${document.expenses.length + 1}-${document.data.contractNumber}`
            :
            '';

    let dogovorTags = {
        items: document.data.services,
        act_countItems: `${document.data.services.length} ${document.data.services.length == 1 ? 'наименование' :
            document.data.services.length > 1 && document.data.services.length <= 4 ? 'наименования' :
                document.data.services.length >= 5 ? 'наименований' : ''}`,

        dogovorYear: new Date().getFullYear(),
        expense_creationDate: formData.creationDate,
        expense_number: nomerScheta,
        own_ip_fullName: document.data.ip.fullName,
        own_ip_shortName: document.data.ip.shortName,
        own_ip_bank: document.data.ip.bank,
        own_ip_inn: document.data.ip.inn,
        own_ip_bik: document.data.ip.bik,
        own_ip_ks: document.data.ip.ks,
        own_ip_rs: document.data.ip.rs,
        own_ip_phone: document.data.ip.phone,
        own_ip_email: document.data.ip.email,
        own_ip_post: document.data.ip.post,
        own_ip_initials: document.data.ip.initials,
        contractNumber: document.data.contractNumber,
        numberDate: document.data.numberDate,
        contractSubjectGen: document.data.contractSubjectGen,
        stoimostNumber: document.data.stoimostNumber,
        writtenAmountAct: document.data.writtenAmountAct,
        writtenDate: document.data.writtenDate,
        contragent_post: document.data.contragent.post,
        contragent_directorName: document.data.contragent.type == 'Самозанятый' ? document.data.contragent.fullName : document.data.contragent.directorName,
        expense_own_ip_requisites: `${document.data.ip.fullName}, ИНН: ${document.data.ip.inn}, Р/с: ${document.data.ip.rs}, ${document.data.ip.bank}, БИК: ${document.data.ip.bik}, К/с: ${document.data.ip.ks}`,
        expense_contragent_requisites:
            document.data.contragent.type == 'Гос'
                ?
                (document.data.contragent.NKAZCH != '' && document.data.contragent.EKAZSCH != '' && document.data.contragent.LSCH != '') ?
                    `${document.data.contragent.fullName}, ИНН: ${document.data.contragent.INN}, КПП: ${document.data.contragent.KPP}, Номер казначейского счета: ${document.data.contragent.NKAZCH}, Единый казначейский счет: ${document.data.contragent.EKAZSCH}, ${document.data.contragent.bankName}, БИК: ${document.data.contragent.BIK}, Л/сч: ${document.data.contragent.LSCH}, ОГРН: ${document.data.contragent.OGRN}`
                    :
                    `${document.data.contragent.fullName}, ИНН: ${document.data.contragent.INN}, КПП: ${document.data.contragent.KPP}, Р/СЧ: ${document.data.contragent.RSCH}, К/СЧ: ${document.data.contragent.KSCH}, ${document.data.contragent.bankName}, БИК: ${document.data.contragent.BIK}, ОГРН: ${document.data.contragent.OGRN}, `
                :
                document.data.contragent.type == 'МСП'
                    ?
                    `${document.data.contragent.fullName}, ИНН: ${document.data.contragent.INN}, ОГРН: ${document.data.contragent.OGRN}, КПП: ${document.data.contragent.KPP}, Р/с: ${document.data.contragent.RSCH}, ${document.data.contragent.bankName}, БИК: ${document.data.contragent.BIK}, К/с: ${document.data.contragent.KSCH}`
                    :
                    document.data.contragent.type == 'ИП'
                        ?
                        `${document.data.contragent.fullName}, ИНН: ${document.data.contragent.INN}, ОГРНИП: ${document.data.contragent.OGRNIP}, Р/с: ${document.data.contragent.RSCH}, ${document.data.contragent.bankName}, БИК: ${document.data.contragent.BIK}, К/с: ${document.data.contragent.KSCH}`
                        :
                        document.data.contragent.type == 'Самозанятый'
                            ?
                            `${document.data.contragent.fullName}, ИНН: ${document.data.contragent.INN}, Р/с: ${document.data.contragent.RSCH}, ${document.data.contragent.bankName}, БИК: ${document.data.contragent.BIK}, К/с: ${document.data.contragent.KSCH}`
                            :
                            '',
    }

    let nameForExpense =
        document.data.ip.fio == 'Уртенов Азамат Заурович' ? 'Azamat' :
            document.data.ip.fio == 'Джатдоев Алим Сеит-Алиевич' ? 'Alim' :
                '';
    const templateName = `templates/expenses/Template_schet_${nameForExpense}.docx`;
    const templateContent = fs.readFileSync(templateName, 'binary');

    const zip = new PizZip(templateContent);
    const doc = new Docxtemplater(zip, {
        nullGetter(part) {
            if (part.value === undefined) {
                return "";
            }
            return part.value;
        }
    });

    doc.setData(dogovorTags);



    try {
        doc.render();
        const output = doc.getZip().generate({ type: 'nodebuffer' });

        const filename = `Счет №${nomerScheta} от ${formData.creationDate} для ${formData.contractName}`;
        const filePath = `docs/${filename}`;

        fs.writeFileSync(filePath, output);

        document.expenses.push({
            expensesNumber: nomerScheta,
            creationDate: formData.creationDate,
            filename: filename
        });

        fs.writeFileSync(jsonFilePath, JSON.stringify(documents, null, 2));

        res.status(200).send('Счет успешно создан и добавлен в договор');
    } catch (error) {
        console.error('Ошибка при создании счета:', error);
    }

});

// Эндпоинт для создания акта
app.post('/generate-acts', (req, res) => {
    const { formData } = req.body;

    const jsonFilePath = 'db/documents.json';
    let documents = [];

    if (fs.existsSync(jsonFilePath)) {
        const jsonData = fs.readFileSync(jsonFilePath, 'utf-8');
        if (jsonData.trim().length > 0) {
            documents = JSON.parse(jsonData);
        }
    }

    const document = documents.find(doc => doc.filename === formData.contractName);

    if (!document) {
        return res.status(404).send('Договор не найден');
    }

    if (!document.acts) {
        document.acts = [];
    } ``

    let nomerActa = document.data.ip.fio == 'Джатдоев Алим Сеит-Алиевич'
        ?
        `${document.data.contractNumber}-A${document.acts.length + 1}`
        :
        document.data.ip.fio == 'Уртенов Азамат Заурович'
            ?
            `A${document.acts.length + 1}-${document.data.contractNumber}`
            :
            '';

    let dogovorTags = {
        items: document.data.services,
        act_countItems: `${document.data.services.length} ${document.data.services.length == 1 ? 'наименование' :
            document.data.services.length > 1 && document.data.services.length <= 4 ? 'наименования' :
                document.data.services.length >= 5 ? 'наименований' : ''}`,

        own_ip_post: document.data.ip.post,
        own_ip_initials: document.data.ip.initials,
        own_ip_print: document.data.ip.print.toLowerCase() == 'да' ? 'М.П.' : 'Б.П.',

        contragent_post: document.data.contragent.post,
        contragent_initials: document.data.contragent.initials,
        contragent_print: document.data.contragent.print.toLowerCase() == 'да' ? 'М.П.' : 'Б.П.',

        receiver_post: document.data.receiver && document.data.receiver.post,
        receiver_initials: document.data.receiver && document.data.receiver.initials,
        receiver_print: document.data.receiver && document.data.receiver.print.toLowerCase() == 'да' ? 'М.П.' : 'Б.П.',

        writtenDate: document.data.writtenDate,

        dogovorYear: new Date().getFullYear(),
        act_creationDate: formData.creationDate,
        act_number: nomerActa,
        own_ip_fullName: document.data.ip.fullName,
        own_ip_shortName: document.data.ip.shortName,
        contractNumber: document.data.contractNumber,
        numberDate: document.data.numberDate,
        contractSubjectGen: document.data.contractSubjectGen,
        stoimostNumber: document.data.stoimostNumber,
        writtenAmountAct: document.data.writtenAmountAct,
        contragent_directorName: document.data.contragent.type == 'Самозанятый' ? document.data.contragent.fullName : document.data.contragent.directorName,
        receiver_post: document.data.receiver && document.data.receiver.post,
        receiver_directorName: document.data.receiver && (document.data.receiver.type == 'Самозанятый' ? document.data.receiver.fullName : document.data.receiver.directorName),
        act_own_ip_requisites: `${document.data.ip.fullName}, ИНН: ${document.data.ip.inn}, Р/с: ${document.data.ip.rs}, ${document.data.ip.bank}, БИК: ${document.data.ip.bik}, К/с: ${document.data.ip.ks}`,
        act_contragent_requisites:
            document.data.contragent.type == 'Гос'
                ?
                (document.data.contragent.NKAZCH != '' && document.data.contragent.EKAZSCH != '' && document.data.contragent.LSCH != '') ?
                    `${document.data.contragent.fullName}, ИНН: ${document.data.contragent.INN}, КПП: ${document.data.contragent.KPP}, Номер казначейского счета: ${document.data.contragent.NKAZCH}, Единый казначейский счет: ${document.data.contragent.EKAZSCH}, ${document.data.contragent.bankName}, БИК: ${document.data.contragent.BIK}, Л/сч: ${document.data.contragent.LSCH}, ОГРН: ${document.data.contragent.OGRN}`
                    :
                    `${document.data.contragent.fullName}, ИНН: ${document.data.contragent.INN}, КПП: ${document.data.contragent.KPP}, Р/СЧ: ${document.data.contragent.RSCH}, К/СЧ: ${document.data.contragent.KSCH}, ${document.data.contragent.bankName}, БИК: ${document.data.contragent.BIK}, ОГРН: ${document.data.contragent.OGRN}, `
                :
                document.data.contragent.type == 'МСП'
                    ?
                    `${document.data.contragent.fullName}, ИНН: ${document.data.contragent.INN}, ОГРН: ${document.data.contragent.OGRN}, КПП: ${document.data.contragent.KPP}, Р/с: ${document.data.contragent.RSCH}, ${document.data.contragent.bankName}, БИК: ${document.data.contragent.BIK}, К/с: ${document.data.contragent.KSCH}`
                    :
                    document.data.contragent.type == 'ИП'
                        ?
                        `${document.data.contragent.fullName}, ИНН: ${document.data.contragent.INN}, ОГРНИП: ${document.data.contragent.OGRNIP}, Р/с: ${document.data.contragent.RSCH}, ${document.data.contragent.bankName}, БИК: ${document.data.contragent.BIK}, К/с: ${document.data.contragent.KSCH}`
                        :
                        document.data.contragent.type == 'Самозанятый'
                            ?
                            `${document.data.contragent.fullName}, ИНН: ${document.data.contragent.INN}, Р/с: ${document.data.contragent.RSCH}, ${document.data.contragent.bankName}, БИК: ${document.data.contragent.BIK}, К/с: ${document.data.contragent.KSCH}`
                            :
                            '',
        act_receiver_requisites: document.data.receiver &&
            (document.data.receiver.type == 'Гос'
                ?
                (document.data.receiver.NKAZCH != '' && document.data.receiver.EKAZSCH != '' && document.data.receiver.LSCH != '') ?
                    `${document.data.receiver.fullName}, ИНН: ${document.data.receiver.INN}, КПП: ${document.data.receiver.KPP}, Номер казначейского счета: ${document.data.receiver.NKAZCH}, Единый казначейский счет: ${document.data.receiver.EKAZSCH}, ${document.data.receiver.bankName}, БИК: ${document.data.receiver.BIK}, Л/сч: ${document.data.receiver.LSCH}, ОГРН: ${document.data.receiver.OGRN}`
                    :
                    `${document.data.receiver.fullName}, ИНН: ${document.data.receiver.INN}, КПП: ${document.data.receiver.KPP}, Р/СЧ: ${document.data.receiver.RSCH}, К/СЧ: ${document.data.receiver.KSCH}, ${document.data.receiver.bankName}, БИК: ${document.data.receiver.BIK}, ОГРН: ${document.data.receiver.OGRN}, `
                :
                document.data.receiver.type == 'МСП'
                    ?
                    `${document.data.receiver.fullName}, ИНН: ${document.data.receiver.INN}, ОГРН: ${document.data.receiver.OGRN}, КПП: ${document.data.receiver.KPP}, Р/с: ${document.data.receiver.RSCH}, ${document.data.receiver.bankName}, БИК: ${document.data.receiver.BIK}, К/с: ${document.data.receiver.KSCH}`
                    :
                    document.data.receiver.type == 'ИП'
                        ?
                        `${document.data.receiver.fullName}, ИНН: ${document.data.receiver.INN}, ОГРНИП: ${document.data.receiver.OGRNIP}, Р/с: ${document.data.receiver.RSCH}, ${document.data.receiver.bankName}, БИК: ${document.data.receiver.BIK}, К/с: ${document.data.receiver.KSCH}`
                        :
                        document.data.receiver.type == 'Самозанятый'
                            ?
                            `${document.data.receiver.fullName}, ИНН: ${document.data.receiver.INN}, Р/с: ${document.data.receiver.RSCH}, ${document.data.receiver.bankName}, БИК: ${document.data.receiver.BIK}, К/с: ${document.data.receiver.KSCH}`
                            :
                            ''),
    }


    const templateName = `templates/${document.data.contractType}-side/acts/Template_${formData.contractType}_side_act.docx`;
    const templateContent = fs.readFileSync(templateName, 'binary');

    const zip = new PizZip(templateContent);
    const doc = new Docxtemplater(zip, {
        nullGetter(part) {
            if (part.value === undefined) {
                return "";
            }
            return part.value;
        }
    });

    doc.setData(dogovorTags);



    try {
        doc.render();
        const output = doc.getZip().generate({ type: 'nodebuffer' });

        const filename = `Акт №${nomerActa} от ${formData.creationDate} для ${formData.contractName}`;
        const filePath = `docs/${filename}`;

        fs.writeFileSync(filePath, output);

        document.acts.push({
            actsNumber: nomerActa,
            contractType: formData.contractType,
            creationDate: formData.creationDate,
            filename: filename
        });

        fs.writeFileSync(jsonFilePath, JSON.stringify(documents, null, 2));

        res.status(200).send('Счет успешно создан и добавлен в договор');
    } catch (error) {
        console.error('Ошибка при создании счета:', error);
    }

});

// Эндпоинт для создания отчета
app.post('/generate-report', (req, res) => {
    const { formData } = req.body;

    const jsonFilePath = 'db/documents.json';
    let documents = [];

    if (fs.existsSync(jsonFilePath)) {
        const jsonData = fs.readFileSync(jsonFilePath, 'utf-8');
        if (jsonData.trim().length > 0) {
            documents = JSON.parse(jsonData);
        }
    }

    const document = documents.find(doc => doc.filename === formData.contractName);

    if (!document) {
        return res.status(404).send('Договор не найден');
    }

    if (!document.reports) {
        document.reports = [];
    } ``

    let dogovorTags = {
        items: document.data.services,
        dogovorYear: new Date().getFullYear(),
        report_creationDate: formData.creationDate,
        numberDate: document.data.numberDate,

        own_ip_fullName: document.data.ip.fullName,
        own_ip_shortName: document.data.ip.shortName,
        own_ip_initials: document.data.ip.initials,

        contragent_post: document.data.contragent.post,
        contragent_orgNameGen: document.data.contragent.orgNameGen,
        contragent_fullName: document.data.contragent.fullName,
        contractSubjectGen: document.data.contractSubjectGen,
        contragent_shortName: document.data.contragent.type == 'Самозанятый' ? document.data.contragent.fullName : document.data.contragent.shortName,
        contragent_initials: document.data.contragent.initials,

        receiver_orgNameGen: document.data.receiver && document.data.receiver.directorFullNameGen,
        receiver_post: document.data.receiver && document.data.receiver.post,
        receiver_fullName: document.data.receiver && document.data.receiver.fullName,
        receiver_initials: document.data.receiver && document.data.receiver.initials,

        contractNumber: document.data.contractNumber,
        writtenDate: document.data.writtenDate,
        stoimostNumber: document.data.stoimostNumber,
    }

    const templateName = `templates/${document.data.contractType}-side/reports/${formData.reportTemplate}.docx`;
    const templateContent = fs.readFileSync(templateName, 'binary');

    const zip = new PizZip(templateContent);
    const doc = new Docxtemplater(zip, {
        nullGetter(part) {
            if (part.value === undefined) {
                return "";
            }
            return part.value;
        }
    });

    doc.setData(dogovorTags);

    try {
        doc.render();
        const output = doc.getZip().generate({ type: 'nodebuffer' });

        const filename = `Отчет №${document.reports.length + 1} от ${formData.creationDate} для ${formData.contractName}`;
        const filePath = `docs/${filename}`;

        fs.writeFileSync(filePath, output);

        document.reports.push({
            creationDate: formData.creationDate,
            filename: filename
        });

        fs.writeFileSync(jsonFilePath, JSON.stringify(documents, null, 2));

        res.status(200).send('Счет успешно создан и добавлен в договор');
    } catch (error) {
        console.error('Ошибка при создании счета:', error);
    }

});

// Эндпоинт для добавления данных в ipName.json
app.post('/add-ip', (req, res) => {
    const { formData } = req.body;

    const jsonFilePath = 'db/ipName.json';
    let ipNames = [];

    if (fs.existsSync(jsonFilePath)) {
        const jsonData = fs.readFileSync(jsonFilePath, 'utf-8');
        if (jsonData.trim().length > 0) {
            ipNames = JSON.parse(jsonData);
        }
    }

    ipNames.push(formData);

    fs.writeFileSync(jsonFilePath, JSON.stringify(ipNames, null, 2));

    res.status(200).send('IP добавлено');
});

// Эндпоинт для добавления данных в contragents.json
app.post('/add-contragent', (req, res) => {
    const { formData } = req.body;

    const jsonFilePath = 'db/contragents.json';
    let contragents = [];

    if (fs.existsSync(jsonFilePath)) {
        const jsonData = fs.readFileSync(jsonFilePath, 'utf-8');
        if (jsonData.trim().length > 0) {
            contragents = JSON.parse(jsonData);
        }
    }

    contragents.push(formData);

    fs.writeFileSync(jsonFilePath, JSON.stringify(contragents, null, 2));

    res.status(200).send('Контрагент добавлен');
});

// Endpoint to delete a document by filename
app.delete('/delete-document', (req, res) => {
    const { filename } = req.body;

    if (!filename) {
        return res.status(400).json({ error: 'Filename is required.' });
    }

    const jsonFilePath = 'db/documents.json';
    let documents = [];

    if (fs.existsSync(jsonFilePath)) {
        const jsonData = fs.readFileSync(jsonFilePath, 'utf-8');
        if (jsonData.trim().length > 0) {
            documents = JSON.parse(jsonData);
        }
    } else {
        return res.status(500).json({ error: 'Documents file does not exist.' });
    }

    const initialLength = documents.length;
    documents = documents.filter(doc => doc.filename !== filename);

    if (documents.length === initialLength) {
        return res.status(404).json({ error: 'Document not found.' });
    }

    fs.writeFileSync(jsonFilePath, JSON.stringify(documents, null, 2), 'utf-8');
    res.status(200).json({ message: 'Document deleted successfully.' });
});

app.put('/update-document-state', (req, res) => {
    const { filename, state } = req.body;

    // Проверка на наличие данных
    if (!filename || state === undefined) {
        return res.status(400).json({ error: 'Filename and state are required.' });
    }

    const jsonFilePath = 'db/documents.json';
    let documents = [];

    // Проверка существования файла с документами
    if (fs.existsSync(jsonFilePath)) {
        const jsonData = fs.readFileSync(jsonFilePath, 'utf-8');
        if (jsonData.trim().length > 0) {
            documents = JSON.parse(jsonData);
        }
    } else {
        return res.status(500).json({ error: 'Documents file does not exist.' });
    }

    // Поиск документа по имени файла
    const documentIndex = documents.findIndex(doc => doc.filename === filename);

    if (documentIndex === -1) {
        return res.status(404).json({ error: 'Document not found.' });
    }

    // Обновление состояния документа
    documents[documentIndex].state = state;

    // Сохранение обновленного списка документов
    fs.writeFileSync(jsonFilePath, JSON.stringify(documents, null, 2), 'utf-8');

    res.status(200).json({ message: 'Document state updated successfully.' });
});

const sslOptions = {
    key: fs.readFileSync('../../../etc/letsencrypt/live/backend.demoalazar.ru/privkey.pem'),
    cert: fs.readFileSync('../../../etc/letsencrypt/live/backend.demoalazar.ru/fullchain.pem')
};

// const server = http.createServer(app);

// server.listen(80, () => {
//     console.log('Сервер запущен на порту 80');
// });

https.createServer(sslOptions, app).listen(443, () => {
    console.log(`HTTPS server running on port 443`);
});