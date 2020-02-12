const inquirer = require("inquirer");
const joi = require("joi");
const axios = require("axios");
const generateHTML = require("./generateHTML")
const puppeteer = require("puppeteer")
const fs = require("fs");

const questions = [
    {
        type: "input",
        name: "githubUser",
        message: "What is your GitHub handle?",
        validate: validateHandle
    },
    {
        type: "list",
        message: "Choose your favorite color",
        name: "bgcolor",
        choices: [
            "green",
            "blue",
            "pink",
            "red"
        ],
        validate: validateColor
    }
]

function onValidation(err, val) {
        if (err) {
            console.log(err.message);
            valid = err.message;
        }
        else {
            valid = true;
        }

        return valid;
}

function validateHandle(name) {
    return joi.validate(name, joi.string().required(), onValidation);
}

function validateColor(color) {
    return joi.validate(color, joi.array().min(1), onValidation);
}

async function writeToFile(data) {
    console.log(`Create profile for ${data.githubUser} with a ${data.bgcolor} background.`);

    try {
        const res = await axios
            .get(`https://api.github.com/users/${data.githubUser}`);
        
        const res2 = await axios
            .get(`https://api.github.com/search/repositories?q=user:${data.githubUser}&sort=stars&order=desc`);
        
        //const htmlToPDF = new HTMLToPDF(generateHTML(res.data, res2.data, data.bgcolor));
        const htmlcontent = await generateHTML(res.data, res2.data, data.bgcolor);
        fs.writeFile(`${data.githubUser}_profile.html`, htmlcontent, err => {
            if (err){
                return console.log(err);
            }
            console.log("HTML file created!")
        }); 
        
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        //console.log("Navigating to: " + __dirname + `/${data.githubUser}_profile.html`)
        await page.setContent(htmlcontent);
        await page.screenshot();
        await page.pdf({
            path: `${data.githubUser}_profile.pdf`,
            format: 'Letter'
        });
        await browser.close();
        console.log("PDF file created!")
    }
    catch (err) {
        console.log(err);
    }
}

function init() {
    inquirer.prompt(questions).then(writeToFile);
}

init();
