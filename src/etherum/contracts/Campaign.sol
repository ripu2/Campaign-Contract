pragma solidity ^0.4.17;

contract CampaignFactory {

    address[] public deployedCampaigns;

    function createCampaign(uint minCon, uint minFund) public{
        address newCampaign = new Campaign(minCon, minFund, msg.sender);
        deployedCampaigns.push(newCampaign);
    }

    function getDeployedCampigns() public view returns(address []) {
        return deployedCampaigns;
    }
 }

contract Campaign {

    struct Request{
        string description;
        uint value;
        address recipient;
        bool complete;
        uint approvalCount;
        mapping(address => bool) approlversList;
    }

    address public manager;
    uint public minimumFund;
    uint public minimumContribution;
    mapping(address => bool) public donors;
    mapping(address => bool) public approvers;
    uint public donorCount;
    Request[] public requests;

    modifier onlyManagerAccess(){
        require(msg.sender == manager);
        _;
    }
    
    function Campaign(uint minContribution, uint minFund, address creator) public {
        manager = creator;
        minimumContribution = minContribution;
        minimumFund = minFund;
    }
    // function Campaign(uint minContribution, uint minFund) public {
    //     manager = msg.sender;
    //     minimumContribution = minContribution;
    //     minimumFund = minFund;
    // }
    
    function contribute() public payable{
        require(msg.value >= minimumContribution);
            require(msg.sender != manager);
                donors[msg.sender] = true;
                donorCount++;
    }


    function createRequest(uint rquestAmount, string description, address recipient)
        public onlyManagerAccess payable{
            Request memory newRequest = Request({
                description: description,
                value: rquestAmount,
                recipient: recipient,
                complete: false,
                approvalCount: 0
            });
            requests.push(newRequest);
        }

    function getBalance() public view returns(uint){
        return uint(address(this).balance);
    }

    function approveRequest(uint index) public{
        Request storage request = requests[index];
        require(donors[msg.sender]);
            require(!request.approlversList[msg.sender]);
                request.approlversList[msg.sender] = true;
                request.approvalCount++;

    }

    function finalizeTransaction(uint index) public onlyManagerAccess {
        Request storage request = requests[index];
        require(!request.complete);
            require(request.approvalCount > (donorCount/2));
                request.recipient.transfer(request.value);
                request.complete = true;
    }

}