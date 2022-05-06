const assert = require('assert')
const ganache = require('ganache-cli')

const Web3 = require('web3')

const web3 = new Web3(ganache.provider());

const compiledFactory = require('../src/etherum/build/CampaignFactory.json');
const compiledCompaign = require('../src/etherum/build/Campaign.json');

let accounts;
let factory;
let campaignAddress;
let campaign;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts()

    factory = await new web3.eth.Contract(JSON.parse(compiledFactory.interface))
        .deploy({ data: compiledFactory.bytecode })
        .send({ from: accounts[0], gas: '1000000' })

    await factory.methods.createCampaign('100', '10000')
        .send({
            from: accounts[0],
            gas: '1000000'
        });

    [campaignAddress] = await factory.methods.getDeployedCampigns().call();
    campaign = await new web3.eth.Contract(JSON.parse(compiledCompaign.interface),
        campaignAddress);
})

describe('Campaign', () => {
    it('deloyes a factory and a campaign', () => {
        assert.ok(factory.options.address)
        assert.ok(campaign.options.address)
    });

    it("marks caller as campaign manager", async () => {
        const manager = await campaign.methods.manager().call()
        assert(manager === accounts[0]) 
    })

    it("minimum amount for contribution", async () => {
        try {
            await campaign.methods.contribute().send({
                value: 50,
                from: accounts[1]
            })
            assert(false)
        } catch (err) {
            assert(err)
        }
    })

    it("allow people to contribute and check account is donor or not", async () => {
        await campaign.methods.contribute().send({
            value: 110,
            from: accounts[1]
        })

        const isContributer = campaign.methods.donors(accounts[1]).call()
        assert(isContributer)
    })

    it("manager has ability to create requesr", async() => {
        await campaign.methods.
            createRequest('10', 'Buy it', accounts[1])
            .send({
                from:accounts[0],
                gas: '1000000'
            });
        const request = await campaign.methods.requests(0).call();
        assert.equal(request.description, 'Buy it');
    })

    it("approve request", async() => {
        await campaign.methods.contribute().send({
            value: web3.utils.toWei('10', 'ether'),
            from: accounts[1]
        })

        await campaign.methods.
            createRequest(web3.utils.toWei('5', 'ether'), 'Buy medicines', accounts[2])
            .send({
                from:accounts[0],
                gas: '1000000'
            });
        console.log('reqqq =====>',await campaign.methods.requests(0).call())

        await campaign.methods.
            approveRequest(0).send({
                from: accounts[1],
                gas: '1000000'
            })
        
        console.log('reqqq =====>',await campaign.methods.requests(0).call())

        await campaign.methods.
        finalizeTransaction(0).send({
            from:accounts[0],
            gas: '1000000'
        })

        let bal = await web3.eth.getBalance(accounts[2])
        bal = web3.utils.fromWei(bal, 'ether');
        bal = parseFloat(bal)

        console.log('balalnce =====>', bal)
        console.log('reqqq =====>',await campaign.methods.requests(0).call())

        assert(bal > 104)
    })
});