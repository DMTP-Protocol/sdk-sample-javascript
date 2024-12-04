// game.js
function getTelegramUserId() {
  try {
    return window.Telegram.WebApp.initDataUnsafe.user.id;
  } catch (error) {
    return 1000000000;
  }
}
function loadBecScript(env) {
  if (!env) {
    const urlParams = new URLSearchParams(window.location.search);
    env = urlParams.get('env') || 'prod';
  }
  

  const existingScript = document.querySelector('#bec-script');
  if (existingScript) {
    document.body.removeChild(existingScript);
  }

  // Tạo script mới
  const script = document.createElement('script');
  script.id = 'becScript';
  script.src = env === 'dev' 
    ? "https://tma-demo.dmtp.tech/sdk/0.0.8/bec.js?walletAddress=QnLOYksIDhA3MfBLoRL%2ByIa8jRggeovB3NtN3d7LD7g%3D"
    : "https://bec.dmtp.tech/0.0.8/bec.js?walletAddress=QnLOYksIDhA3MfBLoRL%2ByIa8jRggeovB3NtN3d7LD7g%3D";
  script.async = true;

  script.onload = () => {
    console.log("Bec script loaded successfully!");
    if (typeof TE !== 'undefined' && typeof TE.onLoad === 'function') {
      TE.onLoad();
    } else {
      console.warn("TE.onLoad function not available");
    }
  };

  script.onerror = () => {
    console.error("Failed to load Bec script");
  };

  document.body.appendChild(script);

  // custom offer wall
  document.addEventListener('becLoaded', function (event) {
    if (typeof TE !== 'undefined' && TE.configureOfferWallStyle) {
        TE.configureOfferWallStyle({
        topBar: {
            backgroundColor: '#2c3e50',
            textColor: '#ecf0f1'
        },
        content: {
            backgroundColor: '#34495e',
            appNameColor: '#ecf0f1',
            appDescriptionColor: '#bdc3c7'
        },
        button: {
            backgroundColor: '#3498db',
            textColor: '#ffffff',
            highlightedBackgroundColor: '#2980b9',
            highlightedTextColor: '#ffffff',
            outlineColor: '#3498db'
        }
    });
    } else {
        console.warn('TE is not defined or configureOfferWallStyle is missing.');
    }
  });
}
// DOM utilities
function createElement(tag, attributes = {}, ...children) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === "style") {
      Object.assign(element.style, value);
    } else if (key.startsWith("on") && typeof value === "function") {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      element[key] = value;
    }
  }
  children.forEach((child) => {
    if (typeof child === "string") {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  });
  return element;
}

// Game Components
function GameObject({ position, onClick, imageUrl }) {
  const object = createElement("img", {
    src: imageUrl,
    style: {
      position: "absolute",
      left: `${position.x}px`,
      top: `${position.y}px`,
      cursor: "pointer",
      transition: "all 0.3s ease",
    },
    onclick: onClick,
    alt: "Game Object",
  });
  document.body.appendChild(object);
  return object;
}

function ScorePanel({ score }) {
  const panel = document.getElementById("score-panel");
  if (!panel) {
    const newPanel = createElement(
      "div",
      {
        id: "score-panel",
        style: {
          position: "absolute",
          top: "10px",
          left: "10px",
          fontSize: "24px",
          color: "white",
          fontWeight: "bold",
          zIndex: 10,
          textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
        },
      },
      `Score: ${score}`
    );
    document.body.appendChild(newPanel);
    return newPanel;
  }
  panel.textContent = `Score: ${score}`;
  return panel;
}

function AboutModal({ isOpen, onClose, gameInfo, environment, isTMA }) {
  const existingModal = document.getElementById("about-modal");
  if (!isOpen) {
    if (existingModal) existingModal.remove();
    return null;
  }

  const modal = createElement(
    "div",
    {
      id: "about-modal",
      style: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 2000,
      },
    },
    createElement(
      "div",
      {
        style: {
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "10px",
          maxWidth: "80%",
          maxHeight: "80%",
          overflow: "auto",
        },
      },
      createElement("h2", {}, `About ${gameInfo.name}`),
      createElement("h3", {}, "Background Image"),
      createElement("p", {
        innerHTML: gameInfo.backgroundCredit,
      }),
      createElement("h3", {}, "Object Image"),
      createElement("p", {
        innerHTML: gameInfo.objectCredit,
      }),
      createElement("h3", {}, "Apps Network Role"),
      createElement("p", {}, `Current role: ${gameInfo.role || "Not specified"}`),
      createElement("h3", {}, "Telegram User Info (Debug)"),
      createElement("p", {}, `User ID: ${getTelegramUserId()}`),
      createElement("h3", {}, "Environment"),
      createElement("p", {}, `Current environment: ${environment}`),
      createElement("h3", {}, "TMA mode"),
      createElement("p", {}, `Is in TMA: ${isTMA}`),
      createElement(
        "button",
        { onclick: onClose },
        "Close"
      )
    )
  );

  if (!existingModal) {
    document.body.appendChild(modal);
  }
  return modal;
}

// Game Configuration
const games = {
  cosmicClicker: {
    name: "Cosmic Clicker",
    backgroundUrl: 'game_assets/space-background.jpg',
    backgroundCredit: 'Photo by <a href="https://unsplash.com/@andyjh07?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Andy Holmes</a> on <a href="https://unsplash.com/photos/milky-way-during-night-time-LUpDjlJv4_c?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>',
    objectUrl: 'game_assets/spaceship-cute.png',
    objectCredit: 'Photo by <a href="https://designer.microsoft.com/consumerTermsOfUse/en-GB/consumerTermsOfUse.pdf">DALLE 3</a>',
    moveInterval: 3000,
  },
  forestFriend: {
    name: "Forest Friend",
    backgroundUrl: 'game_assets/forest-background.jpg',
    backgroundCredit: 'Photo by <a href="https://unsplash.com/@howardbouchevereau?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Howard Bouchevereau</a> on <a href="https://unsplash.com/photos/a-forest-of-tall-trees-nifQzholGAc?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>',
    objectUrl: 'game_assets/forest_friend-cute.png',
    objectCredit: 'Photo by <a href="https://designer.microsoft.com/consumerTermsOfUse/en-GB/consumerTermsOfUse.pdf">DALLE 3</a>',
    moveInterval: 2500,
  },
  balloonBopper: {
    name: "Balloon Bopper",
    backgroundUrl: 'game_assets/sky-background.jpg',
    backgroundCredit: 'Photo by <a href="https://unsplash.com/@thomasdupon_be?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Thomas Dupon</a> on <a href="https://unsplash.com/photos/white-clouds-and-blue-sky-during-daytime-KuuHp9HgCI0?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>',
    objectUrl: 'game_assets/balloon-cute.png',
    objectCredit: 'Photo by <a href="https://designer.microsoft.com/consumerTermsOfUse/en-GB/consumerTermsOfUse.pdf">DALLE 3</a>',
    moveInterval: 3500,
  },
  deepSeaClicker: {
    name: "Deep Sea Clicker",
    backgroundUrl: 'game_assets/ocean-background.jpg',
    backgroundCredit: 'Photo by <a href="https://unsplash.com/@silasbaisch?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Silas Baisch</a> on <a href="https://unsplash.com/photos/blue-and-clear-body-of-water-K785Da4A_JA?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash">Unsplash</a>',
    objectUrl: 'game_assets/jellyfish-cute.png',
    objectCredit: 'Photo by <a href="https://designer.microsoft.com/consumerTermsOfUse/en-GB/consumerTermsOfUse.pdf">DALLE 3</a>',
    moveInterval: 3000,
  },
};

// Function to get the current game type based on URL params
const getGameType = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('game') || 'cosmicClicker';
};

// Get the game type from URL params, defaulting to 'cosmicClicker'
const gameType = getGameType();

// Get the configuration for the selected game
const gameConfig = games[gameType] || games.cosmicClicker;
// Main Game Logic
(function Game() {
  let score = 0;
  let position = { x: 0, y: 0 };
  let isAboutOpen = false;
  let interval = null; // This will store the interval ID
  let currentObject = null; // This will store the current GameObject instance
  let gameState = 'menu'; // 'menu', 'playing', 'paused'
  let menu = null;
  let buttons = {};
  const gameInfo = {
    name: "My Game",
    backgroundCredit: "Background image credit here",
    objectCredit: "Object image credit here",
  };

  const renderGameObject = () => {
  if (!currentObject) {
    currentObject = GameObject({
      position,
      onClick: () => {
        score += 1;
        moveObject();
        renderScorePanel();
           // Reset the interval when the object is clicked
        if (interval) {
          clearInterval(interval);  // Clear the existing interval
        }
        interval = setInterval(moveObject, gameConfig.moveInterval);
      },
      imageUrl: gameConfig.objectUrl,
    });

    // Apply transition to make movement smooth
    currentObject.style.zIndex = '10';
    currentObject.style.transition = 'left 0.5s ease, top 0.5s ease';
  }

  // Update position of the existing object
  currentObject.style.left = `${position.x}px`;
  currentObject.style.top = `${position.y}px`;
  };

  const renderScorePanel = () => {
    ScorePanel({ score });
  };

  const moveObject = () => {
    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - 100;
    position = {
      x: Math.random() * maxX,
      y: Math.random() * maxY,
    };
    renderGameObject();
  };

  const startGame = () => {
    gameState = "playing";
    moveObject();
    renderScorePanel();
     // Start the interval to move the object periodically
    interval = setInterval(moveObject, gameConfig.moveInterval);
    renderMainMenu();
  };

  const showAbout = () => {
    isAboutOpen = true;
    AboutModal({
      isOpen: isAboutOpen,
      onClose: () => {
        isAboutOpen = false;
        AboutModal({ isOpen: isAboutOpen });
      },
      gameInfo,
      environment: "prod",
      isTMA: false,
    });
  };

const handlePauseClick = () => {
  gameState = 'paused';
  renderMainMenu();
  if (TE && typeof TE.offerWall === 'function') {
      TE.offerWall();
  } else {
      console.error('TE is not defined or offerWall is not a function');
  }
};

const onResume = () => {
  gameState = 'playing';
  renderMainMenu();
};


const onShowTopScores = () => {
  alert('Showing top scores...');
};

const onQuit = () => {
  gameState = 'menu';
  renderMainMenu();
};
  const renderMainMenu = () => {
  // Remove existing menu if any
  if (menu) {
    menu.remove();
  }

  // Create a new menu based on the game state
  menu = createElement(
    'div',
    {
      style: {
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 10,
      },
    },
    createElement(
      'button',
      {
        onclick: startGame,
        style: { display: gameState === 'menu' ? 'inline-block' : 'none' },
      },
      'Start New Game'
    ),
    createElement(
      'button',
      {
        onclick: handlePauseClick,
        style: { display: gameState === 'playing' ? 'inline-block' : 'none' },
      },
      'Pause'
    ),
    createElement(
      'button',
      {
        onclick: onResume,
        style: { display: gameState === 'paused' ? 'inline-block' : 'none' },
      },
      'Resume'
    ),
    createElement('button', { onclick: onShowTopScores }, 'Top Scores'),
    createElement('button', { onclick: showAbout }, 'About'),
    createElement('button', { onclick: onQuit }, 'Quit')
  );

  document.body.appendChild(menu);
};
  loadBecScript();
  renderMainMenu();
})();
