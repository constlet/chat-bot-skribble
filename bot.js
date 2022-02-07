var localName = localStorage.getItem('name');

class Player {
    id = '';
    username = '';
    spinsLeft = 3;
    spinsUsed = 0;

    currency = 100;
    wins = 0;
    loses = 0;

    badges = '🍃';

    level = 1;
    exp = 0;

    lastCommand = '';
    
    isSelf = false;

    // free gift
    giftClaimed = false;

    // command target
    targetId = ''; // player id targeted with chat command ie ( /attack Player12 )
    
    // betting
    bet = 0;

    // giving
    giveAmount = 0;
    
    // attacking
    attacks = 0;
    attackCooldown = 0;
    
    // exp level system
    AddExp(exp) {
        this.exp += exp;
        this.level = Math.floor( 0.25 * Math.sqrt(this.exp) ) + 1;
    }

    lastActive = Date.now();
    commandsFired = 0;

    constructor(id, username) {
        this.id = id;
        this.username = username;
        if (username === localName) {
            this.isSelf = true;
        }
    }   
}

class RPG {
    settings = {
        fps: 1,     // Chat output update rate
        tick: 15,   // Bot update rate
        lineLimit: 64, // Chat output limit per line
        leaderboardEntries: 5, // Leaderboard entries
        slotCount: 3,
        winChance: 0.6,
        commandHelpCooldown: 30,
        commandLeaderCooldown: 10,
        attackCooldown: 66,
        newPlayerGreet: true,
        saveLocally: false,
        debug: true
    };

    //https://fsymbols.com/letters/
    font = {
        enabled: true,
        schema: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+-= ',   // original font
        new: "𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗+-= ",    // new font
        charHex: 2,
    };

    // Chat commands ie(/help)
    commands = {
        "help": 0,
        "level": 1,
        "lvl": 1,
        "exp": 2,
        "spin": 3,
        "roll": 3,
        "bet": 4,
        "bid": 4,
        "wins": 5,
        "loses": 6,
        "spins": 7,
        "leader": 8,
        "leaders": 8,
        "leaderboard": 8,
        "leaderboards": 8,
        "badges": 9,
        "badge": 9,
        "cash": 10,
        "bank": 10,
        "joe": 10,
        "currency": 10,
        "money": 10,
        "coins": 10,
        "balance": 10,
        "coin": 10,
        "gold": 10,
        "rank": 11,
        "place": 11,
        "free": 12,
        "claim": 12,
        "gift": 13,
        "give": 13,
        "attack": 14,
        "glitch": 15,
        "glitchy": 15,
        "lag": 15,
        "hack": 15,
        "hacker": 15,
        "hacking": 15,
        "bot": 15,
        "rules": 16,
    };
    

    _commands = [];

    messages = {
        bigwin: "❗ 𝘽𝙄𝙂 𝙒𝙄𝙉 ❗",
        jackpot: "💸 𝙅𝘼𝘾𝙆𝙋𝙊𝙏  💸",
        ultrawin: "🤑 𝙐𝙇𝙏𝙍𝘼 𝙈𝙀𝙂𝘼 𝙒𝙄𝙉 🤑",
        pepegaWin: "🤪 Ｐｅｐｅｇａ Ｗｉｎ 🤪",
        thiccWin: "⥼ ⲦⲎⲒⲤⲤ ⲰⲒⲚ ⥽",
        welcome: " 👋 Hey "
    };

    items = [
        "🍊",
        "🍒",
        "🍉",
        "🍇",
        "🔔",
        "7️⃣",
        "💎",
    ];

    itemsEnum = {
        Orange: 0,
        Cherry: 1,
        Watermelon: 2,
        Grape: 3,
        Bell: 4,
        Seven: 5,
        Diamond: 6,
    }

    itemValues = [
        0.25,
        1,
        3,
        10,
        25,
        50,
        100
    ]

    placements = ["🥇","🥈","🥉"];

    badges = {
        New: "🍃", 
        FirstPlace: "🥇",
        SecondPlace: "🥈", 
        ThirdPlace: "🥉", 
        DiamondWinner: "💎",
        JackpotWinner: "7️⃣", 
        TenWins: "🍒", 
        Rich: "💵", 
        Billionaire: "🕴",
        Zuckerburg: "🤑",
        WorldDomination: "🌎",
        Gamer: "🕹",
        HighRoller: "🧻",
        BigBetter: "📈",
        Addict: "💉",
        Broke: "💩",
        Gangster: "🔫",
        Evil: "👿",
        Giver: "😇"
    };

    // players <Player[]>
    players = []; 

    // messageQueue
    messageQueue = [];

    // Timing
    dt = 0;
    time = 0;
    lastMessageSentTime = Date.now();
    messageRate = 0;
    commandHelpCooldown = 0;
    commandLeaderCooldown = 0;

    // Vars
    intervalTick = null;
    intervalStep = null;

    // Elements
    $button;        // Auto clicker button element
    $input;         // Chat input element
    $messages;      // Chat messages elements

    constructor(inputQuery = '#inputChat', messagesQuery = '#boxMessages') {
        this.LoadPlayers();

        // enumerate commands
        this._commands = [ 
            this.commandHelp.bind(this),
            this.commandLevel.bind(this),
            this.commandExp.bind(this),
            this.commandSpin.bind(this),
            this.commandBet.bind(this),
            this.commandWins.bind(this),
            this.commandLoses.bind(this),
            this.commandSpins.bind(this),
            this.commandLeaderboard.bind(this),
            this.commandBadges.bind(this),
            this.commandCurrency.bind(this),
            this.commandRank.bind(this),
            this.commandGift.bind(this),
            this.commandGive.bind(this),
            this.commandAttack.bind(this),
            this.commandGlitch.bind(this),
        ]

        this.$input = document.querySelector(inputQuery);
        this.$messages = document.querySelector(messagesQuery);

        if (!this.$input || !this.$messages) {
            throw new Error('Invalid input or messages querySelector');
        }

        this.Init();

        // Run
        this.intervalTick = setInterval(this.Tick.bind(this), this.settings.tick);
        this.intervalStep = setInterval(this.Step.bind(this), 1000 / this.settings.fps);
        
    }  

    LoadPlayers() {
        if (!this.settings.saveLocally) return;

        this.players = [];
        let playersStorage = localStorage.getItem('players');
        let _players = playersStorage ? JSON.parse(playersStorage) : [];
        for (var i = 0; i < _players.length; i++) {
            let _playerData = _players[i];
            let __player = new Player(_playerData.id, _playerData.username);
            // loop through _playerData keys and set __player
            for (let key in _playerData) {
                if (__player.hasOwnProperty(key)) {
                    __player[key] = _playerData[key];
                }
            }
            this.players.push( __player );
        }
    }

    SavePlayers() {
        if (!this.settings.saveLocally) return;

        localStorage.setItem('players', JSON.stringify(this.players));
    }

    ClearPlayers() {
        this.players = [];
        if (localStorage.getItem('players')) {
            localStorage.removeItem('players');
        }
    }

    Init() {

        if (!this.$button) {
            this.$button = document.createElement('button');
            this.$button.innerText = 'RPG Game';
            this.$button.style.width = '100%';
            if (this.$input.parentNode) {
                this.$input.parentNode.appendChild(this.$button);
            }
            else {
                console.error("No Input Parent Node found.");
            }
        }

        this.Send( "🍒 𝙒𝙚𝙡𝙘𝙤𝙢𝙚 𝙩𝙤 𝙎𝙡𝙤𝙩𝙨! 🍒" );
        this.Send( "𝙏𝙮𝙥𝙚 /help 𝙩𝙤 𝙜𝙚𝙩 𝙨𝙩𝙖𝙧𝙩𝙚𝙙" );

    }

    Destroy() {
        if (this.intervalTick) {
            clearInterval(this.intervalTick);
            this.intervalTick = null;
        }
        if (this.intervalStep) {
            clearInterval(this.intervalStep);
            this.intervalStep = null;
        }
        this.players.length = 0;
    }

    // Command finder (/ or !)
    Command(player, command) {

        // check player
        if (!player) {
            return;
        }

        // set player active
        player.lastActive = Date.now();

        // Check if commands has command string without the /!
        let str = command;
        if (str[0] === '/' || str[0] === '!') {
            str = str.substring(1);
        }
        else if (str[0] !== '•') {
            str = str;
        }
        else {
            return null;
        }

        let cmdStr = str.split(' ')[0].toLowerCase();

        // get bet amount
        if (cmdStr === 'bet') {
            let betStr = str.split(' ')[1];

            let betAmount = betStr === "all" ? player.currency : +betStr;
            
            if (!isNaN(betAmount)) {
                betAmount = Math.round(betAmount);
                if (betAmount <= 0) {
                    betAmount = 10;
                }
            }
            else {
                betAmount = 10;
            }

            player.bet = betAmount;
        }

        // get targeted id
        if (cmdStr === 'attack' || cmdStr === 'give') {
            let targetId = str.split(' ')[1];
            console.log('targeting player: ' + targetId);
            if (targetId) {
                let successful = true;
                if (cmdStr === 'give') {
                    let giveAmount = +str.split(' ')[2];
                    if (giveAmount && !isNaN(giveAmount)) {
                        giveAmount = Math.round(giveAmount);
                        player.giveAmount = giveAmount;
                    }
                    else {
                        successful = false;
                    }
                }

                if (successful) {
                    player.targetId = targetId;
                }
            }
        }

        str = str.toLowerCase();

        // running command
        //console.log(player, str);

        // Get index
        str = str.split(' ')[0];
        let index = this.commands[str];
        
        // Debug
        if (this.settings.debug && index !== undefined) {
            console.log('Checking for Command');
                console.log('   Command Found:', str, 'index:', index);
        }

        if (index !== undefined && index > -1) {

            // Check Cooldowns
            player.lastCommand = str;
            let cmd = this._commands[index];
            if (index === 0 || index === 8) {
                if (index === 0) {
                    if (Date.now() - this.commandHelpCooldown <= this.settings.commandHelpCooldown * 1000) {
                        cmd = null;
                    }
                    else {
                        this.commandHelpCooldown = Date.now();
                    }
                }
                else if (index === 8) {
                    if (Date.now() - this.commandLeaderCooldown <= this.settings.commandLeaderCooldown * 1000) {
                        cmd = null;
                    }
                    else {
                        this.commandLeaderCooldown = Date.now();
                    }
                }
            }
            return cmd;
        }
        return null;
    }

    RunCommandForPlayer(player, command) {
        if (this.settings.debug) {
            console.log('Running Command:', command);
        }
        if (player) {
            if (command && typeof command === 'function') {
                player.commandsFired += 1;
                command(player);

                if (player.currency < 5) {
                    player.currency = 100;
                    this.Send(`Gifting ${this.convertStringToFont(player.username)} - 💰: ${this.convertStringToFont(100)}`);
                    this.AddBadge(player, this.badges.Broke);
                }

                this.SavePlayers();
            }
        }
    }

    // add to message queue
    Send(value) {
        this.messageQueue.push(value);

        if (this.settings.debug) {
            console.log("[MessageQueue]", this.messageQueue);
        }
    }

    // progress message queue
    StepMessageQueue() {
        const { $button, $input, messageQueue } = this;

        // Check message rate
        // if (Date.now() - this.lastMessageSentTime < 1500) {
        //     if (this.messageRate > 3) {
        //         this.messageRate = 0;
        //         this.lastMessageSentTime -= 1500;
        //         return;
        //     }
        // }

        if (messageQueue.length > 0) {
            this.lastMessageSentTime = Date.now();
            this.messageRate++;
            let message = messageQueue.shift();
            if (this.settings.debug) {
                console.log("updating queue with message:", message);
            }
            if (message && $button && $input) {
                $input.value = message;
                $button.disabled = false;
                $button.click();
            }

            //console.log('stepped message queue:', messageQueue);
        }
    }

    ClearMessageQueue() {
        this.messageQueue.length = 0;
    }

    Tick() {
        // Guards
        if (!this.$messages || !this.$input) {
            console.error('Invalid $messages or $input');
            return;
        }

        // Calculate dt
        const now = Date.now();
        this.dt = (now - this.time) / 1000;
        this.time = now;

        // Find Users & Chat messages
        let nodes = this.$messages.childNodes;
        if (nodes) {
            let strings = [];
            for (var i = 0; i < nodes.length; i++) 
            {
                let node = nodes[i];
                if (!node.evaluated) { // hacky way of knowing what has been checked and run
                    node.evaluated = true;

                    let children = node.childNodes;
                    if (children && children.length > 1) {

                        let username = children[0].value || children[0].innerText || children[0].textContent;
                        let chatStr = children[1].value || children[1].innerText || children[1].textContent;
                        username = username.trim().replace(':', '');

                        if (username && chatStr) {
                            let player = this.AddPlayer(username, username, true);
                            let command = this.Command(player, chatStr);
                            if (command != null) {
                                this.RunCommandForPlayer(player, command);
                            }

                            break;
                        }
                    }
                }
             }
         }
    }

    Step() {
        // Update Messages
        this.StepMessageQueue();
    }
    
    FindPlayerByUsername(username, partial = false) {
        const { players } = this;
        for (var i = 0; i < players.length; i++) {
            let player = players[i];
            if (partial) {
                if (player.username.indexOf(username) > -1) {
                    return player;
                }
            }
            else {
                if (player.username === username) {
                    return player;
                }
            }
        }
        return null;
    }

    FindPlayer(id, partial = false) {
        const { players } = this;
        for (var i = 0; i < players.length; i++) {
            let player = players[i];
            if (partial) {
                if (player.id.indexOf(id) > -1) {
                    return player;
                }
            }
            else {
                if (player.id === id) {
                    return player;
                }
            }
        }
        return null;
    }

    AddPlayer(id, username, fresh = false) {
        const { players } = this;
        let player = this.FindPlayer(id);

        // new
        if (!player) {
            // Debug
            if (this.settings.debug) {
                console.log('Adding Player:', id)
                console.log("[Players]:", this.players);
            }

            player = new Player(id, username);
            players.push(player);

            this.SavePlayers();
            
            if (fresh && !player.isSelf && this.settings.newPlayerGreet) {
                this.Send( this.messages.welcome + `${this.convertStringToFont(username)}` + ' - Type /help' );
            }
        }

        // always update
        player.username = username;
        player.lastActive = Date.now();

        return player;
    }

    RemovePlayer(id) {
        const { players } = this;
        let player = this.FindPlayer(id);
        if (player) {
            let index = players.indexOf(player);
            if (index > -1) {
                players.splice(index, 1);
            }

            this.SavePlayers();

            // Debug
            if (this.settings.debug) {
                console.log('Removing Player:', id)
                console.log("[Players]:", this.players);
            }
        }
    }

    AddBadge(player, badge) {
        // find badge in badges
        let badgeId = "";
        for (let key in this.badges) {
            if (this.badges[key] === badge) {
                badgeId = key;
                break;
            }
        }

        if (player && badgeId && this.badges.hasOwnProperty(badgeId)) {
            //let badge = this.badges[ badgeId ];
            if (player.badges.indexOf(badge) < 0) {
                player.badges += badge;
                //this.SavePlayers();

                this.Send(`${this.convertStringToFont(player.username)} - Received a Badge! ${badge} ${this.convertStringToFont(badgeId)}`);
            }
        }
    }

    RemoveBadge(player, badgeId) {
        if (player && badgeId && this.badges.hasOwnProperty(badgeId)) {
            let badge = this.badges[ badgeId ];
            if (player.badges.indexOf(badge) > -1) {
                player.badges = player.badges.replace(badge, '');
                //this.SavePlayers();
            }
        }
    }

    // Command Methods
    commandHelp(player) {
        //this.Send(`${this.convertStringToFont(player.username)} - Commands:`);
       // this.Send(`${player.username} - Commands:`);
        this.Send(`│ /bet [amount] - Bet Amount.`);
        this.Send(`│ /level - Player Level.`);
        this.Send(`│ /leader - Leaderboards.`);
        this.Send(`│ /coins - Player Currency.`);
        this.Send(`│ /badges - Player Badges.`);
        this.Send(`│ /attack [name] - Attack a Player.`);
        this.Send(`│ /give [name] [amount] - Give to a Player.`);
    }

    commandLevel(player) {
        this.Send(`${this.convertStringToFont(player.username)} - 𝙇𝙚𝙫𝙚𝙡: ${this.convertStringToFont(player.level)}`);
    }

    commandBadges(player) {
        this.Send(`${this.convertStringToFont(player.username)} - 𝘽𝙖𝙙𝙜𝙚𝙨:【${player.badges}】`);
    }

    commandCurrency(player) {
        this.Send(`${this.convertStringToFont(player.username)} - 💰${player.currency}`);
    }

    commandExp(player) {
        this.Send(`${this.convertStringToFont(player.username)} - 𝙀𝙭𝙥: ${this.convertStringToFont(player.exp)}`);
    }

    commandSpins(player) {
        this.Send(`${this.convertStringToFont(player.username)} - 𝙎𝙥𝙞𝙣𝙨: ${this.convertStringToFont(player.spinsLeft)}`);
    }

    commandLeaderboard(player) {
        const { players, placements, settings, badges } = this;
        var leaderboard = [];
        for (var i = 0; i < players.length; i++) {
            leaderboard.push({username: players[i].username, currency: players[i].currency, level: players[i].level});
        }
        leaderboard.sort(function(a, b) {
            return b.currency - a.currency;
        });

        // Leaderboards
        for (var i = 0; i < Math.min(leaderboard.length, settings.leaderboardEntries); i++) {
            let entry = leaderboard[i];
            let prefix = placements[i] ? placements[i] : '◉';
            this.Send(`│ ${prefix + " " + this.convertStringToFont(entry.username)} - 💰${this.convertStringToFont(entry.currency)} lvl: ${this.convertStringToFont(entry.level)}`);
        }

        // Badges
        for (var i = 0; i < Math.min(leaderboard.length, settings.leaderboardEntries); i++) {
            let entry = leaderboard[i];
            if (i === 0 || i === 1 || i === 2) {
                let __player = this.FindPlayerByUsername(entry.username);
                if (__player) {
                    let badge = i === 0 ? badges.FirstPlace : i === 1 ? badges.SecondPlace : badges.ThirdPlace;
                    this.AddBadge(__player, badge);
                }
            }
        }
    }

    commandRank(player) {
        const { players, placements, settings } = this;
        var leaderboard = [];
        for (var i = 0; i < players.length; i++) {
            leaderboard.push({username: players[i].username, currency: players[i].currency});
        }
        leaderboard.sort(function(a, b) {
            return b.currency - a.currency;
        });

        for (var i = 0; i < Math.min(leaderboard.length, settings.leaderboardEntries); i++) {
            let entry = leaderboard[i];
            if (entry.username === player.username) {
                let prefix = placements[i] ? placements[i] : '◉';
                this.Send(`${prefix + this.convertStringToFont(entry.username)} - 𝙍𝙖𝙣𝙠: ${this.convertStringToFont(i + 1)}`);
                return;
            }
        }
    }

    commandSpin(player) {
        // if (player.spinsLeft > 0) {
        //     player.spinsLeft--;
        //     let result = this.spin(player, 100 );
        // }
        // else {
        //     this.Send(`${this.convertStringToFont(player.username)} - No spins left.`);
        // }
    }

    commandBet(player) {
        let bet = player.bet;
        if (bet > 0 && bet <= player.currency) {
            player.currency -= bet;
            let result = this.spin(player, bet );
        }
        else {
            if (bet > player.currency) {
                this.Send(`${this.convertStringToFont(player.username)} - Not enough 💰` + this.convertStringToFont(player.currency));
            }
            else if (bet <= 0) {
                
            }
        }

        player.bet = 0;
    }
    commandWins(player) {
        this.Send(`${this.convertStringToFont(player.username)} - 𝙒𝙞𝙣𝙨: ${this.convertStringToFont(player.wins)}`);
    }

    commandLoses(player) {
        this.Send(`${this.convertStringToFont(player.username)} - 𝙇𝙤𝙨𝙚𝙨: ${this.convertStringToFont(player.loses)}`);
    }

    commandGlitch(player) {
        this.Send('Ń̶̡̧͚̥̱̬̞̻̹̜͉̹̒͂͂̉̀̊ͅƠ̷͖̥̯͈̦̳̗̖͇̌̈́̄́̿̒͂̋͊̈́̕̕̚ ̵̝͚̾B̶̧̭͙̘̮̠͇̲̗̣͚̓̉͒̍Ȏ̶̳̫̂̉T̵̨̖͙̓̍̌̇̊́͛̕͝');
    }

    commandGift(player) {
        if (!player.giftClaimed) {
            let giftAmount = 1000;
            player.giftClaimed = true;
            player.currency += giftAmount;
            this.Send(`🎁 ${this.convertStringToFont(player.username)} - Received a Gift 💰${this.convertStringToFont(giftAmount)}`);
        }
        else {
            this.Send(`${this.convertStringToFont(player.username)} - You already claimed your gift.`);
        }
    }

    commandGive(player) {
        if (player.targetId && player.giveAmount > 0) {

            if (player.giveAmount <= player.currency) {
                let id = player.targetId;
                let giveTo = this.FindPlayer(id.split(' ')[0], true);
                if (giveTo) {

                    let amount = player.giveAmount;
                    player.currency -= amount;
                    giveTo.currency += amount;

                    this.Send(`${this.convertStringToFont(player.username)} - Gave 💰${this.convertStringToFont(amount)} to ${this.convertStringToFont(giveTo.username)}`);
                    this.AddBadge(player, this.badges.Giver);
                }
                else {
                    this.Send(`${this.convertStringToFont(player.username)} - Player not found.`);
                }
            }
            else {
                this.Send(`${this.convertStringToFont(player.username)} - Not enough 💰 to give.`);
            }
        }

        player.targetId = '';
        player.giveAmount = 0;
    }

    commandAttack(player) {
        let cooldown = Date.now() - player.attackCooldown < this.settings.attackCooldown * 1000;
        if (player.targetId && !cooldown) {
            let id = player.targetId;
            let attackTo = this.FindPlayer(id.split(' ')[0], true);
            if (attackTo) {

                player.attackCooldown = Date.now();
                player.attacks += 1;

                let damage = Math.random();
                let attackAmount = Math.floor(attackTo.currency * 0.1);
                
                if (damage > 0.66) {
                    attackTo.currency -= attackAmount;
                    player.currency += attackAmount;
                    this.Send(`🔪 ${this.convertStringToFont(player.username)} - Attacked ${this.convertStringToFont(attackTo.username)} for 💰 ${this.convertStringToFont(attackAmount)} ✔`);
                }
                else {
                    let loseAmount = Math.floor(player.currency * 0.1);
                    player.currency -= loseAmount;
                    attackTo.currency += loseAmount;
                    if (player.currency < 0) {
                        player.currency = 0;
                    }
                    this.Send(`🔪 ${this.convertStringToFont(player.username)} - Attacked ${this.convertStringToFont(attackTo.username)} and lost 💰 ${this.convertStringToFont(loseAmount)} ❌`);
                }
                
                if (player.attacks >= 10) {
                    this.AddBadge(player, this.badges.Gangster);
                }
                if (player.attacks >= 2) {
                    this.AddBadge(player, this.badges.Evil);
                }
            }
            else { 
                this.Send(`${this.convertStringToFont(player.username)} - Player not found.`);
            }
        }
        else {
            let cooldownRemaining = this.settings.attackCooldown - Math.ceil((Date.now() - player.attackCooldown) / 1000);
            this.Send(`${this.convertStringToFont(player.username)} - Wait ` + this.convertStringToFont(cooldownRemaining) + ` seconds before attacking again.`);
        }

        player.targetId = '';
    }

    spin(player, bet = 100) {
        const { settings } = this;
        // randomly spin x items 
        let _items = [];
        let randomSpin = Math.random(); //- add tiered randomness
        if (randomSpin > settings.winChance) {
            let randomTier = Math.random();
            let randomWin = 0;


            if (randomTier <= 0.20) {
                randomWin = 0;
            }
            else if (randomTier <= 0.37) {
                randomWin = 1;
            }
            else if (randomTier <= 0.52) {
                randomWin = 2;
            }
            else if (randomTier <= 0.66) {
                randomWin = 3;
            }
            else if (randomTier <= 0.79) {
                randomWin = 4;
            }
            else if (randomTier <= 0.9) {
                randomWin = 5;
            }
            else {
                randomWin = 6;
            }

            
            for (var i = 0; i < settings.slotCount; i++) {
                let item = randomWin; // index
                _items.push(item);
            }

        }
        else {
            for (var i = 0; i < settings.slotCount; i++) {
                let item = Math.floor(Math.random() * this.items.length); // index
                _items.push(item);
            }
        }

        // calculate winnings
        let winnings = 0;
        let slotString = '';
        let lost = false;
        
        let lastIndex = -1;
        if (_items.length > 0) {
            lastIndex = _items[0];
            for (let i = 0; i < _items.length; i++) {
                let index = _items[i];
                slotString += this.items[index];

                if (!lost && lastIndex == index) {
                    //
                }
                else {
                    lost = true;
                }

                lastIndex = index;
            }
        }

        if (!lost && lastIndex > -1) {
            let winIndex = lastIndex;
            let winItem = this.items[winIndex];
            let winValue = this.itemValues[winIndex];

            winnings = Math.round(bet * winValue);

            this.Send(`【${slotString}】- ${this.convertStringToFont(player.username)} won 💰${this.convertStringToFont(winnings)}!`);
            this.OnWin(player, _items[0], bet, winnings);
            //this.commandCurrency( player );
        }
        else {
            player.loses++;
            player.AddExp( 10 ); 

            this.Send(`【${slotString}】- ${this.convertStringToFont(player.username)} lost`);
            //this.commandCurrency( player );
        }
    }

    OnWin(player, itemIndex, bet, winnings) 
    {
        player.wins++;
        player.currency += winnings;
        player.AddExp( 100 + Math.round(bet * 0.0000001) ); 

        const { badges, items, itemsEnum } = this;

        if (winnings >= 1000000000) {
            this.Send(`${this.messages.pepegaWin}`);
        }
        else if (winnings >= 100000000) {
            this.Send(`${this.messages.ultrawin}`);
        }
        else if (winnings >= 10000000) {
            this.Send(`${this.messages.jackpot}`);
        }
        else if (winnings >= 100000) {
            this.Send(`${this.messages.bigwin}`);
        }
        else if (winnings >= 25000) {
            this.Send(`${this.messages.thiccWin}`);
        }

        if (bet > 10000000) {
            this.AddBadge(player, badges.HighRoller);
        }
        else if (bet > 100000) {
            this.AddBadge(player, badges.BigBetter);
        }

        if (itemIndex === itemsEnum.Diamond) {
            this.AddBadge(player, badges.DiamondWinner);
        }
        if (itemIndex === itemsEnum.Seven) {
            this.AddBadge(player, badges.JackpotWinner);
        }
        if (player.wins > 100) {
            this.AddBadge(player, badges.Gamer);
        }
        else if (player.wins > 50) {
            this.AddBadge(player, badges.Addict);
        }
        else if (player.wins > 10) {
            this.AddBadge(player, badges.TenWins);
        }

        if (player.currency >= 100000000000) {
            this.AddBadge(player, badges.WorldDomination);
        }
        else if (player.currency >= 10000000000) {
            this.AddBadge(player, badges.Zuckerburg);
        }
        else if (player.currency >= 1000000000) {
            this.AddBadge(player, badges.Billionaire);
        }
        else if (player.currency >= 1000000) {
            this.AddBadge(player, badges.Rich);
        }

    }

    

    // Utilities

    // Convert string to font using fontSchema
    convertStringToFont(string) 
    {
        const { font } = this;
        if (!font.enabled || !font.new) {
            return string;
        }

        // convert
        string = "" + string;

        var result = "";
        for (var i = 0; i < string.length; i++) 
        {
            let str = '' + string[i];
            if (str == ' ') {
                result += ' ';
                continue;
            }
            let index = font.schema.indexOf('' + str);
            if (index == -1) 
            {
                result += '' + string[i];
            }
            else 
            {
                let str = '' + this.getHexCharacter( font.new, index, font.charHex );
                result += str !== '' ? str : '' + string[i];
                
            }
        }
        return result;
    }

    getHexCharacter( string, index, charCount ) {
        var strings = string.split('');
        if (strings[index * charCount + 1] != '') {
            return strings[index * charCount] + strings[index * charCount + 1]
        }
    }

}



/// RPG End -----------------------------------------

// Destroy existing
if (window.rpg) {
    window.rpg.Destroy();
    window.rpg = null;
}

// Init
window.rpg = new RPG();
