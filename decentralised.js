var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
const neatCsv = require('neat-csv');
const fs = require('fs')
const IPFS = require('ipfs-http-client');
const ipfs = new IPFS({host: 'localhost', port: 5001, protocol: 'http' });
const fileToArrayBuffer = require('file-to-array-buffer');
var time = process.hrtime();
var csvWriter = require('csv-write-stream')
var writer = csvWriter({sendHeaders: false})
const NS_PER_SEC = 1e9;

// This is for connecting with the smart contract
// We need the abi of the smart contract, its transaction hash and the owner of the contract(the address from which the ethers will be taken for deploying the contract.)
const voltageContract = new web3.eth.Contract(
  [
    {
      "constant": true,
      "inputs": [
        {
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "voltagevalues",
      "outputs": [
        {
          "name": "id",
          "type": "uint256"
        },
        {
          "name": "file_name",
          "type": "bytes32"
        },
        {
          "name": "hash",
          "type": "bytes32"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "constant": false,
      "inputs": [
        {
          "name": "filenm",
          "type": "string"
        },
        {
          "name": "filehash",
          "type": "string"
        }
      ],
      "name": "addV_Values",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "constant": true,
      "inputs": [
        {
          "name": "filenm",
          "type": "string"
        }
      ],
      "name": "get_ipfs_hash",
      "outputs": [
        {
          "name": "",
          "type": "string"
        }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }
  ]
  , "0x6Bb7a6DCe0e199d16fb9B2160FF2D0c793aB8330",
  {
    from: "0x775cc4f9eb1bdba11e7ea5fb97a111859ba9c652",
    gasPrice: 20000000000
  });

onSubmit = async (name) => {
  let csvFile = name;
  let str = fs.readFileSync(csvFile,'utf8');
  const buffer = IPFS.Buffer.from(str);
  var content = buffer;

  t = time[1]/NS_PER_SEC
  var writer = csvWriter({sendHeaders: false})
  writer.pipe(fs.createWriteStream('start_time.csv', {flags: 'a'}))
  writer.write({Start: t})
  writer.end()
  try{
    await ipfs.add(content, async (error, result) => {

    if (error || !result) {
      await console.log("Reached 1");
      await console.log("Error=>", error);
      await console.log("Reached 2");
    }
    else {
      await console.log("Reached 3");
      ipfsHash = result[0].hash;
      await console.log("Reached 4");

      let ip;
      ip = ipfsHash;
      await console.log("Reached 7");
      await console.log(ipfsHash);
      await onDoit(name, ipfsHash);
    }
    });
  }
  catch (error) {
    console.log("Reached 5");
    return error;
  }
};

// This function is for pinning the file that has been added to ipfs
onDoit = async(name, ipfsHash) => {
	await console.log(ipfsHash)
	await voltageContract.methods.addV_Values(name, ipfsHash).send({ from: '0x775cc4f9eb1bdba11e7ea5fb97a111859ba9c652',
	gas: 8000000 });
  t = time[1]/NS_PER_SEC
  g = web3.eth.getGasPrice(async(err, result) =>{
    if (err){
      console.log(err)
      return
    }
    else{
      price = result
      var writer = csvWriter({sendHeaders: false})
      writer.write({Gas: price})
      writer.end()
    }
  })

  var writer = csvWriter({sendHeaders: false})
  writer.pipe(fs.createWriteStream('end_time.csv', {flags: 'a'}))
  writer.write({End: t})
  writer.end()

}

ipfsSubmit = async(filename) => {
	await console.log(filename)
	await onSubmit(filename);
}

main = async() => {

  var writer = csvWriter({sendHeaders: false})
  writer.pipe(fs.createWriteStream('start_time.csv'))
  writer.write({Start: "Start"})
  writer.end()

  var writer = csvWriter({sendHeaders: false})
  writer.pipe(fs.createWriteStream('end_time.csv'))
  writer.write({End: "End"})
  writer.end()

  var writer = csvWriter({sendHeaders: false})
  writer.pipe(fs.createWriteStream('gas_price.csv'))
  writer.write({Gas: "Gas"})
  writer.end()

  let file_count;
  file_count = 0;
  i = 0;

	await fs.readFile('./created_files.csv', async (err, data) => {
    if (err) {
      console.error(err)
      return
    }
    let a
    a = await neatCsv(data)
    i = 0
    while(1){
      await ipfsSubmit(a[i]['Filenames']);
      i = i + 1
      if(a[i] === undefined)
        break
    }
  })

}



main()