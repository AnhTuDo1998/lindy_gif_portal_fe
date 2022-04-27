import React, { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';
import idl from './idl.json'

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Program, Provider, web3 } from '@project-serum/anchor';

// SystemProgram = Solana runtime
const { SystemProgram, Keypair} = web3;

// Keypair for base account, holding gif info
let baseAccount = Keypair.generate();

// Get our program's id from IDL file
const programID = new PublicKey(idl.metadata.address);

// Set devnet
const network = clusterApiUrl('devnet');

// control how to ack transaction is 'done'
const opts = {
  preflightCommitment: "processed"
}

// Testing Data
const TEST_GIFS = [
  'https://j.gifs.com/YWEXkn.gif',
  'https://media.giphy.com/media/H6WaTvLmAsE2ncEn4O/giphy.gif'
]

// Constants
const TWITTER_HANDLE = 'V0mitB00m98';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const App = () => {
  // **** State ****
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);

  // **** Actions ****

  // Function definition for if Phantom Wallet is connected or not
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!');

          // If already connected
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            'Connected with Public Key:',
            response.publicKey.toString()
          );
          
          // Update state
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Logic for authorization/ connect
  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping")
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      await getGifList();
    } catch(error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  // For GIF submit
  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("No gif link given!")
      return
    }
    setInputValue('');
    console.log('Gif link:', inputValue);
    // write gif to account
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      // Call contract
      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey
        }
      });
      console.log("GIF successfully sent to program", inputValue)

      await getGifList();
    } catch (error) {
      console.log("Error sending GIF:", error)
    }
  };

  // Update input value
  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  // Get provider info
  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );

    return provider;
  }
  // Connect button for wallet authorize
  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

  // Render a grid once connected
  const renderConnectedContainer = () => {
    // If program is not init (new user just connected first time)
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      )
    } else {
      return (
        <div className="connected-container">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendGif();
          }}
        >
          <input
            type="text"
            placeholder="Enter gif link!"
            value={inputValue}
            onChange={onInputChange}
          />
          <button type="submit" className="cta-button submit-gif-button">
            Submit
          </button>
        </form>
        <div className="gif-grid">
					{/* We use index as the key instead, also, the src is now item.gifLink */}
          {gifList.map((item, index) => (
            <div className="gif-item" key={index}>
              <img src={item.gifLink} />
            </div>
          ))}
        </div>
      </div>        
      )
    }
  }

  // **** UseEffect ****
  // Check if wallet is connected when first loaded
  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  // Function to fetch list from SOL chain
  const getGifList = async() => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      
      console.log("Got the account", account)
      setGifList(account.gifList)
  
    } catch (error) {
      console.log("Error in getGifList: ", error)
      setGifList(null);
    }
  }

  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...');
      
      // Call Solana program here.
      getGifList();
  
      // Set state
      //setGifList(TEST_GIFS);
    }
  }, [walletAddress]);

  return (
    <div className="App">
      {/* Fancy render between with and without connected wallet*/}
      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">🖼 Lindy Practices Queue</p>
          <p className="sub-text">
            Lindy GIFs of moves I don't even remember  ✨
          </p>
          {/* Render based on connection of wallet */}
          {!walletAddress && renderNotConnectedContainer()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
