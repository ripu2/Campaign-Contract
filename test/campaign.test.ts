const assert = require('assert')
const ganache = require('ganache-cli')

const Web3 = require('web3')

const web3 = new Web3(ganache.provider({ gasLimit: 1000000000000 }));

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
        .send({ from: accounts[0], gas: '100000000' })
    await factory.methods.createCampaign("Electric Car", "Buy elon musk", "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.cardekho.com%2Ftesla%2Fmodel-s%2Fpictures&psig=AOvVaw2rUHU8eBuoBGDkphLLQYot&ust=1651992600536000&source=images&cd=vfe&ved=0CAwQjRxqFwoTCLi9gpPmzPcCFQAAAAAdAAAAABADy", '100', '10000')
        .send({
            from: accounts[0],
            gas: '1000000000'
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
        console.log('boforeee ====>')
        await campaign.methods.contribute().send({
            value: 110,
            from: accounts[1],
            gas: '1000000'
        })
        console.log('afterr ====>')
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
            from: accounts[1],
            gas: '1000000'
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
                gas: '10000000000'
            })
        
        console.log('reqqq =====>',await campaign.methods.requests(0).call())

        await campaign.methods.
        finalizeTransaction(0).send({
            from:accounts[0],
            gas: '10000000000'
        })

        let bal = await web3.eth.getBalance(accounts[2])
        bal = web3.utils.fromWei(bal, 'ether');
        bal = parseFloat(bal)

        console.log('balalnce =====>', bal)
        console.log('reqqq =====>',await campaign.methods.requests(0).call())

        assert(bal > 104)
    })
});