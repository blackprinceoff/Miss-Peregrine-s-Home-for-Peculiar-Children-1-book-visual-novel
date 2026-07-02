const VN = {
  scenes: {},
  state: {
    currentScene: null,
    currentNodeId: null,
    history: [],
    log: [],
    navStack: [],
    variables: {}
  },
  isTyping: false,
  typewriterHandle: null,
  fullText: '',
  choiceLocked: false,
  skipActive: false,
  skipHandle: null,
  autoActive: false,
  autoHandle: null,
  audioMuted: false,

  registerScene(scene) {
    this.scenes[scene.id] = scene;
  },

  createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 25; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.width = (2 + Math.random() * 3) + 'px';
      p.style.height = p.style.width;
      p.style.animationDuration = (15 + Math.random() * 25) + 's';
      p.style.animationDelay = (Math.random() * 20) + 's';
      p.style.opacity = 0.1 + Math.random() * 0.15;
      container.appendChild(p);
    }
  },

  init() {
    this.createParticles();
    const el = document.getElementById('title-screen');
    if (!el) return;
    el.classList.remove('hidden', 'fade-out');
    try {
      const saved = localStorage.getItem('vn_save');
      document.getElementById('continue-btn').disabled = !saved;
    } catch(e) {
      document.getElementById('continue-btn').disabled = true;
    }
  },

  hideTitle() {
    const el = document.getElementById('title-screen');
    el.classList.add('fade-out');
    setTimeout(() => {
      el.classList.add('hidden');
      el.classList.remove('fade-out');
    }, 800);
  },

  start(sceneId) {
    const scene = this.scenes[sceneId];
    if (!scene) { console.error('Scene not found:', sceneId); return; }
    this.hideTitle();
    this.state.currentScene = sceneId;
    this.state.currentNodeId = scene.nodes[0].id;
    this.state.history = [];
    this.state.log = [];
    this.state.navStack = [];
    this.state.variables = {};
    this.choiceLocked = false;
    this.skipActive = false;
    this.autoActive = false;
    if (this.autoHandle) { clearTimeout(this.autoHandle); this.autoHandle = null; }
    this.updateBackButton();
    this.updateMenuToggles();
    this.save();
    this.playSceneMusic(scene);
    this.showChapterTitle(scene);
  },

  playSceneMusic(scene) {
    if (scene.music) {
      this.playMusic(scene.music);
    }
  },

  showChapterTitle(scene) {
    const card = document.getElementById('chapter-title-card');
    const text = document.getElementById('chapter-title-text');
    text.textContent = scene.title || '';
    card.classList.add('visible');
    setTimeout(() => {
      card.style.opacity = '0';
      setTimeout(() => {
        card.classList.remove('visible');
        card.style.opacity = '';
        this.render();
      }, 800);
    }, 1500);
  },

  getCurrentNode() {
    const scene = this.scenes[this.state.currentScene];
    if (!scene) return null;
    return scene.nodes.find(n => n.id === this.state.currentNodeId) || null;
  },

  getNodeIndex() {
    const scene = this.scenes[this.state.currentScene];
    if (!scene) return -1;
    return scene.nodes.findIndex(n => n.id === this.state.currentNodeId);
  },

  save() {
    localStorage.setItem('vn_save', JSON.stringify(this.state));
  },

  restart() {
    localStorage.removeItem('vn_save');
    if (this.autoHandle) { clearTimeout(this.autoHandle); this.autoHandle = null; }
    this.autoActive = false;
    this.updateMenuToggles();
    this.start('00_prologue');
  },

  pushNav() {
    this.state.navStack.push({
      scene: this.state.currentScene,
      nodeId: this.state.currentNodeId
    });
  },

  goBack() {
    if (this.state.navStack.length === 0) return;
    if (this.isTyping) {
      if (this.typewriterHandle) {
        clearInterval(this.typewriterHandle);
        this.typewriterHandle = null;
      }
      this.isTyping = false;
    }
    this.choiceLocked = true;

    const prev = this.state.navStack.pop();
    const prevNode = this.scenes[prev.scene].nodes.find(n => n.id === prev.nodeId);

    this.state.currentScene = prev.scene;
    this.state.currentNodeId = prev.nodeId;

    if (prevNode && prevNode.type === 'choice') {
      this.state.history.pop();
    }

    this.choiceLocked = false;
    this.updateBackButton();
    this.save();
    this.renderGoBack();
  },

  renderGoBack() {
    const node = this.getCurrentNode();
    if (!node) return;

    if (this.typewriterHandle) {
      clearInterval(this.typewriterHandle);
      this.typewriterHandle = null;
    }
    this.isTyping = false;

    document.getElementById('choice-overlay').classList.remove('visible');
    document.getElementById('next-indicator').classList.remove('visible');
    document.getElementById('dialog-box').classList.remove('choice-active');

    this.setBackground(node.bg);
    this.renderCharacter(node);
    this.updateDialogUI(node);

    if (node.type === 'choice') {
      document.getElementById('dialog-box').classList.add('choice-active');
      if (node.prompt) {
        document.getElementById('speaker-name').textContent = '';
        const textEl = document.getElementById('dialog-text');
        textEl.textContent = node.prompt;
        textEl.className = 'choice-prompt';
      }
      this.renderChoices(node.options);
      document.getElementById('next-indicator').classList.remove('visible');
      return;
    }

    document.getElementById('dialog-text').textContent = node.text || '';
    document.getElementById('next-indicator').classList.add('visible');
  },

  updateBackButton() {
    const btn = document.getElementById('back-btn');
    if (!btn) return;
    btn.style.display = this.state.navStack.length === 0 ? 'none' : 'inline-block';
  },

  setBackground(bg) {
    if (bg) {
      document.getElementById('bg-layer').style.backgroundImage =
        'url(assets/backgrounds/' + bg + '.svg)';
    }
  },

  renderCharacter(node) {
    const charLayer = document.getElementById('character-layer');
    charLayer.innerHTML = '';
    if (node.type === 'dialogue' && node.speaker) {
      const charMap = {
        'Джейкоб': 'jacob',
        'Я': 'jacob',
        'Якоб': 'jacob',
        'Яков': 'jacob',
        'Дід Портман': 'abe',
        'Дід': 'abe',
        'Ейб': 'abe',
        'Абрахам': 'abe',
        'Дідусь': 'abe',
        'Потвора': 'monster'
      };
      const charKey = charMap[node.speaker] || null;
      if (charKey) {
        const img = document.createElement('img');
        img.src = 'assets/characters/' + charKey + '.svg';
        img.alt = node.speaker;
        img.className = 'character-sprite';
        charLayer.appendChild(img);
      }
    }
  },

  updateDialogUI(node) {
    const nameEl = document.getElementById('speaker-name');
    const textEl = document.getElementById('dialog-text');
    const box = document.getElementById('dialog-box');
    textEl.className = '';
    box.classList.remove('narration-mode');

    if (node.type === 'narration') {
      nameEl.textContent = '';
      box.classList.add('narration-mode');
    } else if (node.type === 'dialogue') {
      nameEl.textContent = node.speaker || '';
    } else {
      nameEl.textContent = '';
    }
  },

  runEffects(node) {
    if (node.set) {
      Object.assign(this.state.variables, node.set);
    }
    if (!node.onEnter) return;
    const effects = Array.isArray(node.onEnter) ? node.onEnter : [node.onEnter];
    effects.forEach(eff => {
      switch (eff) {
        case 'shake': this.effectShake(); break;
        case 'flash': this.effectFlash(); break;
        case 'fade-out': this.effectFadeOut(); break;
        case 'fade-in': this.effectFadeIn(); break;
        case 'particles': this.effectParticles(true); break;
        case 'no-particles': this.effectParticles(false); break;
        case 'sfx:click': this.playSfx('assets/audio/click.mp3'); break;
        case 'sfx:choice': this.playSfx('assets/audio/choice.mp3'); break;
      }
    });
  },

  effectShake() {
    const el = document.getElementById('game');
    el.classList.remove('fx-shake');
    void el.offsetWidth;
    el.classList.add('fx-shake');
    setTimeout(() => el.classList.remove('fx-shake'), 500);
  },

  effectFlash() {
    const el = document.getElementById('flash-overlay');
    if (!el) return;
    el.classList.remove('fx-flash');
    void el.offsetWidth;
    el.classList.add('fx-flash');
    setTimeout(() => el.classList.remove('fx-flash'), 300);
  },

  effectFadeOut() {
    const el = document.getElementById('game');
    el.classList.add('fx-fade-out');
  },

  effectFadeIn() {
    const el = document.getElementById('game');
    el.classList.remove('fx-fade-out');
    el.classList.add('fx-fade-in');
    setTimeout(() => el.classList.remove('fx-fade-in'), 600);
  },

  effectParticles(enable) {
    const el = document.getElementById('particles');
    if (!el) return;
    el.classList.toggle('visible', enable);
  },

  render() {
    const node = this.getCurrentNode();
    if (!node) return;

    if (this.typewriterHandle) {
      clearInterval(this.typewriterHandle);
      this.typewriterHandle = null;
    }
    this.isTyping = false;
    this.choiceLocked = false;

    document.getElementById('choice-overlay').classList.remove('visible');
    document.getElementById('next-indicator').classList.remove('visible');
    document.getElementById('dialog-box').classList.remove('choice-active');

    this.setBackground(node.bg);
    this.renderCharacter(node);
    this.updateDialogUI(node);

    this.runEffects(node);

    if (node.type === 'choice') {
      document.getElementById('dialog-box').classList.add('choice-active');
      if (node.prompt) {
        document.getElementById('speaker-name').textContent = '';
        const textEl = document.getElementById('dialog-text');
        textEl.textContent = node.prompt;
        textEl.className = 'choice-prompt';
      }
      this.renderChoices(node.options);
      document.getElementById('next-indicator').classList.remove('visible');
      return;
    }

    this.addToLog(node);
    this.fullText = node.text || '';
    this.typewriteText(this.fullText);
    this.updateBackButton();
  },

  addToLog(node) {
    if (node.type === 'choice') return;
    const last = this.state.log[this.state.log.length - 1];
    if (last && last.scene === this.state.currentScene && last.nodeId === this.state.currentNodeId) return;
    this.state.log.push({
      type: node.type,
      speaker: node.speaker || null,
      text: node.text || '',
      scene: this.state.currentScene,
      nodeId: this.state.currentNodeId
    });
  },

  typewriteText(text) {
    const textEl = document.getElementById('dialog-text');
    this.isTyping = true;
    let idx = 0;
    textEl.textContent = '';

    this.typewriterHandle = setInterval(() => {
      if (idx < text.length) {
        textEl.textContent += text[idx];
        idx++;
      } else {
        clearInterval(this.typewriterHandle);
        this.typewriterHandle = null;
        this.isTyping = false;
        document.getElementById('next-indicator').classList.add('visible');
        this.scheduleAuto();
      }
    }, 30);
  },

  scheduleAuto() {
    if (this.autoHandle) { clearTimeout(this.autoHandle); this.autoHandle = null; }
    if (!this.autoActive) return;
    const node = this.getCurrentNode();
    if (node && node.type === 'choice') {
      this.autoActive = false;
      this.updateMenuToggles();
      return;
    }
    this.autoHandle = setTimeout(() => {
      this.autoHandle = null;
      if (this.autoActive) {
        this.advanceNode();
      }
    }, 2500);
  },

  renderChoices(options) {
    const container = document.getElementById('choice-buttons');
    container.innerHTML = '';
    const overlay = document.getElementById('choice-overlay');
    overlay.classList.add('visible');

    options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = opt.text;
      btn.style.animationDelay = (i * 0.12) + 's';
      btn.addEventListener('click', () => this.handleChoice(opt, i));
      container.appendChild(btn);
    });
  },

  handleChoice(option, index) {
    if (this.choiceLocked) return;
    this.choiceLocked = true;

    this.pushNav();

    this.state.history.push({
      scene: this.state.currentScene,
      nodeId: this.state.currentNodeId,
      choiceIndex: index,
      choiceText: option.text
    });

    this.state.log.push({
      type: 'choice',
      speaker: null,
      text: option.text,
      scene: this.state.currentScene,
      nodeId: this.state.currentNodeId
    });

    if (option.next) {
      if (option.next.startsWith('scene:')) {
        const sceneId = option.next.replace('scene:', '');
        this.state.currentScene = sceneId;
        const scene = this.scenes[sceneId];
        if (scene && scene.nodes.length > 0) {
          this.state.currentNodeId = scene.nodes[0].id;
        }
      } else {
        this.state.currentNodeId = option.next;
      }
    } else {
      this.advanceNode();
    }

    this.save();
    this.render();
  },

  resolveNext(node) {
    if (node.nextIf) {
      for (const [condition, target] of Object.entries(node.nextIf)) {
        if (condition === 'default') {
          return target;
        }
        const [key, val] = condition.split('=');
        if (this.state.variables[key] === val) {
          return target;
        }
      }
    }
    if (node.next) return node.next;
    return null;
  },

  advanceNode() {
    const node = this.getCurrentNode();
    if (!node) return;
    const routed = this.resolveNext(node);
    if (routed) {
      this.pushNav();
      this.state.currentNodeId = routed;
      this.save();
      this.render();
      return;
    }
    const idx = this.getNodeIndex();
    const scene = this.scenes[this.state.currentScene];
    if (!scene) return;
    if (idx >= 0 && idx < scene.nodes.length - 1) {
      this.pushNav();
      this.state.currentNodeId = scene.nodes[idx + 1].id;
      this.save();
      this.render();
    } else if (scene.nextScene) {
      this.state.currentScene = scene.nextScene;
      const nextScene = this.scenes[scene.nextScene];
      if (nextScene && nextScene.nodes.length > 0) {
        this.state.currentNodeId = nextScene.nodes[0].id;
      }
      this.save();
      this.render();
    } else {
      document.getElementById('next-indicator').classList.remove('visible');
    }
  },

  handleClick() {
    const node = this.getCurrentNode();
    if (!node) return;
    if (node.type === 'choice') return;
    if (this.isTyping) {
      if (this.typewriterHandle) {
        clearInterval(this.typewriterHandle);
        this.typewriterHandle = null;
      }
      this.isTyping = false;
      document.getElementById('dialog-text').textContent = this.fullText;
      document.getElementById('next-indicator').classList.add('visible');
      this.scheduleAuto();
      return;
    }
    this.advanceNode();
  },

  toggleBacklog() {
    const panel = document.getElementById('backlog-panel');
    const overlay = document.getElementById('backlog-overlay');
    const isVisible = panel.classList.contains('visible');
    if (isVisible) {
      this.closeBacklog();
    } else {
      this.renderBacklog();
      panel.classList.add('visible');
      overlay.classList.add('visible');
    }
  },

  jumpToLogEntry(index) {
    const entry = this.state.log[index];
    if (!entry || !entry.scene || !entry.nodeId) return;
    if (entry.type === 'choice') return;

    this.autoActive = false;
    if (this.autoHandle) { clearTimeout(this.autoHandle); this.autoHandle = null; }
    this.stopSkip();

    this.state.log = this.state.log.slice(0, index + 1);
    const historyIdx = this.state.history.findIndex(h => h.scene === entry.scene && h.nodeId === entry.nodeId);
    if (historyIdx !== -1) {
      this.state.history = this.state.history.slice(0, historyIdx + 1);
    }

    this.state.currentScene = entry.scene;
    this.state.currentNodeId = entry.nodeId;
    this.save();
    this.closeBacklog();
    this.render();
  },

  closeBacklog() {
    document.getElementById('backlog-panel').classList.remove('visible');
    document.getElementById('backlog-overlay').classList.remove('visible');
  },

  renderBacklog() {
    const container = document.getElementById('backlog-entries');
    container.innerHTML = '';
    const log = this.state.log;
    if (log.length === 0) {
      const div = document.createElement('div');
      div.className = 'backlog-entry backlog-narration';
      div.innerHTML = '<div class="backlog-text">Лог порожній.</div>';
      container.appendChild(div);
      return;
    }
    log.forEach((entry, i) => {
      const div = document.createElement('div');
      const canJump = entry.type !== 'choice' && entry.scene && entry.nodeId;
      if (canJump) {
        div.className = 'backlog-entry backlog-entry-clickable';
        div.dataset.index = i;
        div.addEventListener('click', () => this.jumpToLogEntry(i));
      } else {
        div.className = 'backlog-entry';
      }

      if (entry.type === 'choice') {
        div.classList.add('backlog-choice');
        div.innerHTML = '<div class="backlog-text">' + this.escapeHtml(entry.text) + '</div>';
      } else if (entry.type === 'narration') {
        div.classList.add('backlog-narration');
        div.innerHTML = '<div class="backlog-text">' + this.escapeHtml(entry.text) + '</div>';
      } else if (entry.type === 'dialogue') {
        div.classList.add('backlog-dialogue');
        div.innerHTML = '<div class="backlog-speaker">' + this.escapeHtml(entry.speaker || '') + '</div><div class="backlog-text">' + this.escapeHtml(entry.text) + '</div>';
      }
      container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
  },

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

  startSkip() {
    this.skipActive = true;
    this.updateMenuToggles();
    if (this.isTyping) {
      if (this.typewriterHandle) {
        clearInterval(this.typewriterHandle);
        this.typewriterHandle = null;
      }
      this.isTyping = false;
      document.getElementById('dialog-text').textContent = this.fullText;
      document.getElementById('next-indicator').classList.add('visible');
    }
    this.skipHandle = setInterval(() => {
      if (!this.skipActive) {
        clearInterval(this.skipHandle);
        this.skipHandle = null;
        return;
      }
      const node = this.getCurrentNode();
      if (!node) { this.stopSkip(); return; }
      if (node.type === 'choice') { this.stopSkip(); return; }
      if (this.isTyping) {
        if (this.typewriterHandle) {
          clearInterval(this.typewriterHandle);
          this.typewriterHandle = null;
        }
        this.isTyping = false;
        document.getElementById('dialog-text').textContent = this.fullText;
        document.getElementById('next-indicator').classList.add('visible');
      }
      this.advanceNode();
    }, 80);
  },
  stopSkip() {
    this.skipActive = false;
    if (this.skipHandle) {
      clearInterval(this.skipHandle);
      this.skipHandle = null;
    }
    this.updateMenuToggles();
  },

  updateMenuToggles() {
    const skipBtn = document.getElementById('skip-btn');
    const autoBtn = document.getElementById('auto-btn');
    if (skipBtn) skipBtn.classList.toggle('active', this.skipActive);
    if (autoBtn) autoBtn.classList.toggle('active', this.autoActive);
  },

  toggleAuto() {
    if (this.autoHandle) { clearTimeout(this.autoHandle); this.autoHandle = null; }
    this.autoActive = !this.autoActive;
    this.updateMenuToggles();
    if (this.autoActive && !this.isTyping) {
      const node = this.getCurrentNode();
      if (node && node.type !== 'choice') {
        this.scheduleAuto();
      }
    }
  },

  toggleMute() {
    this.audioMuted = !this.audioMuted;
    const btn = document.getElementById('mute-btn');
    if (btn) btn.textContent = this.audioMuted ? '🔇' : '🔊';
    const bgm = document.getElementById('bgm-audio');
    if (bgm) {
      if (this.audioMuted) { bgm.pause(); } else { bgm.play().catch(function(){}); }
    }
  },

  playMusic(src) {
    if (!src) return;
    const bgm = document.getElementById('bgm-audio');
    if (!bgm) return;
    bgm.src = src;
    if (!this.audioMuted) {
      try { bgm.play().catch(function(){}); } catch(e) {}
    }
  },

  playSfx(src) {
    if (!src) return;
    if (this.audioMuted) return;
    const sfx = document.getElementById('sfx-audio');
    if (!sfx) return;
    sfx.src = src;
    sfx.currentTime = 0;
    try { sfx.play().catch(function(){}); } catch(e) {}
  }
};

document.addEventListener('DOMContentLoaded', () => {
  VN.init();

  const game = document.getElementById('game');
  if (game) {
    game.addEventListener('click', (e) => {
      if (e.target.closest('#choice-overlay')) return;
      if (e.target.closest('#menu')) return;
      VN.handleClick();
    });
  }

  document.getElementById('restart-btn').addEventListener('click', () => {
    if (confirm('Почати гру заново?')) {
      VN.restart();
    }
  });

  document.getElementById('back-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    VN.goBack();
  });

  document.getElementById('new-game-btn').addEventListener('click', () => {
    VN.restart();
  });

  document.getElementById('continue-btn').addEventListener('click', () => {
    if (document.getElementById('continue-btn').disabled) return;
    VN.hideTitle();
    const saved = localStorage.getItem('vn_save');
    if (saved) {
      try {
        VN.state = JSON.parse(saved);
        VN.updateBackButton();
        VN.updateMenuToggles();
        VN.playSceneMusic(VN.scenes[VN.state.currentScene]);
        VN.render();
        return;
      } catch (_) {}
    }
    VN.restart();
  });

  document.getElementById('about-btn').addEventListener('click', () => {
    const modal = document.getElementById('about-modal');
    modal.classList.remove('modal-hidden');
  });

  document.getElementById('about-close-btn').addEventListener('click', () => {
    document.getElementById('about-modal').classList.add('modal-hidden');
  });

  document.getElementById('about-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      e.currentTarget.classList.add('modal-hidden');
    }
  });

  document.getElementById('backlog-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    VN.toggleBacklog();
  });

  document.getElementById('backlog-close').addEventListener('click', () => {
    VN.toggleBacklog();
  });

  document.getElementById('backlog-overlay').addEventListener('click', () => {
    VN.toggleBacklog();
  });

  const skipBtn = document.getElementById('skip-btn');
  skipBtn.addEventListener('mousedown', (e) => { e.stopPropagation(); VN.startSkip(); });
  skipBtn.addEventListener('mouseup', (e) => { e.stopPropagation(); VN.stopSkip(); });
  skipBtn.addEventListener('mouseleave', () => { VN.stopSkip(); });
  skipBtn.addEventListener('touchstart', (e) => { e.preventDefault(); VN.startSkip(); }, { passive: false });
  skipBtn.addEventListener('touchend', (e) => { e.preventDefault(); VN.stopSkip(); }, { passive: false });

  document.getElementById('auto-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    VN.toggleAuto();
  });

  document.getElementById('mute-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    VN.toggleMute();
  });
});