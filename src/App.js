import React, { useEffect, useState } from 'react';
import twitterLogo from './assets/twitter-logo.svg';
import './App.css';

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

  // For GIF submit
  const sendGif = async () => {
    if (inputValue.length > 0) {
      console.log('Gif link:', inputValue);
      setGifList([...gifList, inputValue]);
      // Reset
      setInputValue('');
    } else {
      console.log('Empty input. Try again.');
    }
  };

  // Update input value
  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

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
  const renderConnectedContainer = () => (
    <div className="connected-container">
      <div className="gif-grid">
      {/* For submit gifs */}
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
        <button type="submit" className="cta-button submit-gif-button">Submit</button>
      </form>
      {gifList.map((gif) => (
          <div className="gif-item" key={gif}>
            <img src={gif} alt={gif} />
          </div>
        ))}
      </div>
    </div>
  );

  // **** UseEffect ****
  // Check if wallet is connected when first loaded
  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...');
      
      // Call Solana program here.
  
      // Set state
      setGifList(TEST_GIFS);
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
          >{`built on @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
