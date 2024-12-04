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

class Game {
  constructor(config) {
    this.config = config;
    this.score = 0;
    this.position = { x: 0, y: 0 };
    this.gameState = 'menu';
    this.isAboutOpen = false;
    this.environment = 'prod';
    this.clickVerified = false;
    this.isTMA = false;
    this.role = null;
    this.moveInterval = null;

    this.init();
  }

  async init() {
    document.title = this.config.name;

    await this.initializeEnvironment();

    this.container = document.getElementById('game-container');
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.backgroundImage = `url(${this.config.backgroundUrl})`;
    this.container.style.backgroundSize = 'cover';
    this.container.style.position = 'relative';

    this.createGameTitle();
    this.createScorePanel();
    this.createMainMenu();
    this.createGameObject();
    this.createAboutModal();
  }

  createGameTitle() {
    const title = document.createElement('h1');
    title.textContent = this.config.name;
    title.style.position = 'absolute';
    title.style.top = '60px';
    title.style.left = '10px';
    title.style.fontSize = '28px';
    title.style.color = 'white';
    title.style.fontWeight = 'bold';
    title.style.zIndex = '10';
    title.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    this.container.appendChild(title);
  }

  createScorePanel() {
    this.scorePanel = document.createElement('div');
    this.scorePanel.style.position = 'absolute';
    this.scorePanel.style.top = '10px';
    this.scorePanel.style.left = '10px';
    this.scorePanel.style.fontSize = '24px';
    this.scorePanel.style.color = 'white';
    this.scorePanel.style.fontWeight = 'bold';
    this.scorePanel.style.zIndex = '10';
    this.scorePanel.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    this.updateScore(0);
    this.container.appendChild(this.scorePanel);
  }

  createMainMenu() {
    const menu = document.createElement('div');
    menu.style.position = 'absolute';
    menu.style.top = '10px';
    menu.style.right = '10px';
    menu.style.zIndex = '10';

    const buttons = {
      start: { text: 'Start New Game', state: 'menu', handler: () => this.startGame() },
      pause: { text: 'Pause', state: 'playing', handler: () => this.pauseGame() },
      resume: { text: 'Resume', state: 'paused', handler: () => this.resumeGame() },
      topScores: { text: 'Top Scores', handler: () => this.showTopScores() },
      about: { text: 'About', handler: () => this.showAbout() },
      quit: { text: 'Quit', handler: () => this.quitGame() }
    };

    Object.entries(buttons).forEach(([key, { text, state, handler }]) => {
      const button = document.createElement('button');
      button.textContent = text;
      button.onclick = handler;
      button.dataset.state = state || 'all';
      menu.appendChild(button);
    });

    this.mainMenu = menu;
    this.container.appendChild(menu);
    this.updateMenuVisibility();
  }

  createGameObject() {
    this.gameObject = document.createElement('img');
    this.gameObject.src = this.config.objectUrl;
    this.gameObject.style.position = 'absolute';
    this.gameObject.style.cursor = 'pointer';
    this.gameObject.style.transition = 'all 0.3s ease';
    this.gameObject.style.display = 'none';
    this.gameObject.onclick = () => this.handleClick();
    this.container.appendChild(this.gameObject);
  }

  createAboutModal() {
    this.aboutModal = document.createElement('div');
    this.aboutModal.style.display = 'none';
    this.aboutModal.style.position = 'fixed';
    this.aboutModal.style.top = '0';
    this.aboutModal.style.left = '0';
    this.aboutModal.style.right = '0';
    this.aboutModal.style.bottom = '0';
    this.aboutModal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    this.aboutModal.style.display = 'none';
    this.aboutModal.style.justifyContent = 'center';
    this.aboutModal.style.alignItems = 'center';
    this.aboutModal.style.zIndex = '2000';

    const content = document.createElement('div');
    content.style.backgroundColor = 'white';
    content.style.padding = '20px';
    content.style.borderRadius = '10px';
    content.style.maxWidth = '80%';
    content.style.maxHeight = '80%';
    content.style.overflow = 'auto';

    content.innerHTML = `
      <h2>About ${this.config.name}</h2>
      <h3>Background Image</h3>
      <p>${this.config.backgroundCredit}</p>
      <h3>Object Image</h3>
      <p>${this.config.objectCredit}</p>
      <h3>Apps Network Role</h3>
      <p>Current role: ${this.role || 'Not specified'}</p>
      <h3>Telegram User Info (Debug)</h3>
      <p>User ID: ${getTelegramUserId()}</p>
      <h3>Environment</h3>
      <p>Current environment: ${this.environment}</p>
      <h3>TMA mode</h3>
      <p>Is in TMA: ${this.isTMA}</p>
    `;

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.onclick = () => this.closeAbout();
    content.appendChild(closeButton);

    this.aboutModal.appendChild(content);
    this.container.appendChild(this.aboutModal);
  }

  async initializeEnvironment() {
    const urlParams = new URLSearchParams(window.location.search);
    this.environment = urlParams.get('env') || 'prod';
    this.role = urlParams.get('role');

    if (window.TE && typeof window.TE.onLoad === 'function') {
      window.TE.onLoad();
    }

    this.isTMA = this.detectTMA();
    console.log('TMA detected:', this.isTMA);

    const clickId = this.getClickId();
    const userId = getTelegramUserId();

    if (this.role) {
      await this.verifyClick(clickId, userId, this.environment, this.isTMA, this.role);
    } else {
      console.log('No role specified, skipping click verification');
    }
  }

  detectTMA() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (window.Telegram && window.Telegram.WebApp) {
      if (typeof window.Telegram.WebApp.initData === 'string' && 
          window.Telegram.WebApp.initData.length > 0 &&
          typeof window.Telegram.WebApp.initDataUnsafe === 'object' &&
          Object.keys(window.Telegram.WebApp.initDataUnsafe).length > 0) {
        console.log('Verified Telegram WebApp environment');
        return true;
      }
    }
    
    if (urlParams.has('tgWebAppData') || urlParams.has('tgWebAppVersion')) {
      console.log('Telegram-specific URL parameters found');
      return true;
    }
    
    console.log('Not running in TMA environment');
    return false;
  }

  getClickId() {
    const urlParams = new URLSearchParams(window.location.search);
    let clickId = null;

    if (this.isTMA) {
      if (window.Telegram && window.Telegram.WebApp) {
        const startParam = window.Telegram.WebApp.initDataUnsafe.start_param;
        if (startParam && startParam.startsWith('clickid_')) {
          clickId = startParam.split('_')[1];
        }
      }
      if (!clickId) {
        clickId = urlParams.get('start_param');
      }
    } else {
      clickId = urlParams.get('click_id');
    }

    return clickId;
  }

  async verifyClick(clickId, userId, env, isTMA, userRole) {
    try {
      console.log('Verifying click:', { clickId, userId, env, userRole, isTMA });
      
      const baseUrl = env === 'dev' ? 'https://click-dev.dmtp.tech' : 'https://click.dmtp.tech';
      let apiUrl;

      if (userRole === 'publisher') {
        apiUrl = `${baseUrl}/banners/events?`;
        if (isTMA && userId) {
          apiUrl += `wa=QnLOYksIDhA3MfBLoRL%2ByIa8jRggeovB3NtN3d7LD7g%3D&tui=${userId}`;
        } else if (!isTMA && clickId) {
          apiUrl += `wa=QnLOYksIDhA3MfBLoRL%2ByIa8jRggeovB3NtN3d7LD7g%3D&tui=${userId}`;
        } else {
          console.error('Invalid parameters for publisher verification');
          return;
        }

        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();
          console.log('Publisher events retrieved:', data);
          if (data.items && data.items.length > 0) {
            const clickEvents = data.items.filter(item => item.action === "CLICK");
            if (clickEvents.length > 0) {
              console.log(`${clickEvents.length} offer wall click event(s) found, verifying click`);
              this.clickVerified = true;
              const newScore = data.items.length * 10;
              this.updateScore(newScore);
              console.log(`Set initial score to ${newScore} based on ${data.items.length} event(s)`);
            }
          }
        }
      } else if (userRole === 'advertiser') {
        if (isTMA) {
          if (!userId) {
            console.error('User ID is required for TMA mode verification');
            return;
          }
          apiUrl = `${baseUrl}/banners/verify?tui=${encodeURIComponent(userId)}`;
          if (clickId) {
            apiUrl += `&click_id=${encodeURIComponent(clickId)}`;
          }
        } else {
          if (!clickId) {
            console.error('Click ID is required for non-TMA mode verification');
            return;
          }
          apiUrl = `${baseUrl}/banners/verify?click_id=${encodeURIComponent(clickId)}`;
        }

        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();
          console.log('Advertiser click verification response:', data);
          if (data.valid) {
            this.clickVerified = true;
            this.updateScore(100);
            console.log('Click verified, set score to 100!');
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  updateScore(newScore) {
    this.score = newScore;
    this.scorePanel.textContent = `Score: ${this.score}`;
  }

  moveObject() {
    const maxX = window.innerWidth - 100;
    const maxY = window.innerHeight - 155;
    this.position = {
      x: Math.random() * maxX,
      y: Math.random() * maxY + 155
    };
    this.gameObject.style.left = `${this.position.x}px`;
    this.gameObject.style.top = `${this.position.y}px`;
  }

  handleClick() {
    this.updateScore(this.score + 1);
    this.moveObject();
  }

  startGame() {
    if (!this.clickVerified) {
      this.updateScore(0);
    }
    this.gameState = 'playing';
    this.gameObject.style.display = 'block';
    this.moveObject();
    this.moveInterval = setInterval(() => this.moveObject(), this.config.moveInterval);
    this.updateMenuVisibility();
  }

  pauseGame() {
    this.gameState = 'paused';
    clearInterval(this.moveInterval);
    this.updateMenuVisibility();
    if (window.TE && typeof window.TE.offerWall === 'function') {
      window.TE.offerWall();
    }
  }

  resumeGame() {
    this.gameState = 'playing';
    this.moveInterval = setInterval(() => this.moveObject(), this.config.moveInterval);
    this.updateMenuVisibility();
  }

  showTopScores() {
    alert('Top Scores: Coming soon!');
  }

  quitGame() {
    this.gameState = 'menu';
    clearInterval(this.moveInterval);
    this.gameObject.style.display = 'none';
    if (!this.clickVerified) {
      this.updateScore(0);
    }
    this.updateMenuVisibility();
  }

  showAbout() {
    this.aboutModal.style.display = 'flex';
  }

  closeAbout() {
    this.aboutModal.style.display = 'none';
  }

  updateMenuVisibility() {
    const buttons = this.mainMenu.getElementsByTagName('button');
    Array.from(buttons).forEach(button => {
      const state = button.dataset.state;
      button.style.display = (state === 'all' || state === this.gameState) ? 'inline' : 'none';
    });
  }
}

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

function getGameType() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('game') || 'cosmicClicker';
}

const gameType = getGameType();
const gameConfig = games[gameType] || games.cosmicClicker;

document.addEventListener('DOMContentLoaded', async () => {
  loadBecScript();
  new Game(gameConfig);
});