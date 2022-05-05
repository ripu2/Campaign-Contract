const assert = require('assert')
const ganache = require('ganache-cli')
const Web3 = require('web3')

const web3 = new Web3(ganache.provider());

const compiledFactory = require('../etherum/build/CampaignFactory.json');
const compiledCompaign = require('../etherum/build/Campaign.json');

let accounts;
let factory;
let campaignAddress;
let campaign;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts()

    factory = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
        .deploy({
            date: compiledFactory.byteCode
        })
        .send({
            from: accounts[0],
            gas: '100000'
        })

    await factory.methods.createCompaign('10', '10000').send({
        from: accounts[0],
        gas: '100000'
    });

    [ campaignAddress ] = await factory.methods.getDeployedCampigns().call();

    // here we have two different syntax for deployment because the parent instace has already been deployed,
    // so we need no to deploy Campaign again. Instead, we'll jsut pass the adreess where our code is compiled
    // on local blockchain just like atAdress property of remix!!!
    
    campaign = await new web3.eth.Contract(JSON.parse(compiledCompaign.interface), campaignAddress)
})


