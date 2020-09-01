(async () => {
const Discord = require('discord.js'),
      fnbr = require('fnbr'),
      fetch = require('node-fetch'),
      moment = require('moment'),
      config = require('./config.json'),
      { Client, Enums } = require('fnbr'),
      { discordUserStatus, customJoinMessage, token, cid, bid, eid, bp, level, pickaxeId, prefix, ownerOnly, ownerIDs, acceptInvite, acceptFriend, discordStatus, discordStatusType, fortniteStatus, fortnitePlatform, fortniteKairosID } = require('./config');

const { readFile, writeFile } = require('fs').promises;

Object.defineProperty(Array.prototype, 'flat', {
    value: function(depth = 1) {
      return this.reduce(function (flat, toFlatten) {
        return flat.concat((Array.isArray(toFlatten) && (depth>1)) ? toFlatten.flat(depth-1) : toFlatten);
      }, []);
    }
});

const getCosmetic = async (cosmeticType, cosmeticSearch) => {
  const url =
    'https://fortnite-api.com/v2/cosmetics/br/search' +
    '?matchMethod=contains' +
    `&name=${cosmeticSearch}` +
    `&backendType=${cosmeticType}`;

  return (await fetch(url)).json();
};

const Options = {
  status: fortniteStatus,
  platform: fortnitePlatform,
    kairos: {
      cid: fortniteKairosID,
      color: Enums.KairosColor.BLUE,
    },
  auth: {}
}

    try {
    Options.auth.deviceAuth = JSON.parse(await readFile('./deviceAuth.json'));
  } catch (e) {
    Options.auth.authorizationCode = async () => Client.consoleQuestion('[FORTNITE] Please enter an authorization code: ');
  }

const fortnite = new Client(Options);
const discord = new Discord.Client();

function success(command, cosmetic, message) {
  const embed = new Discord.MessageEmbed()
  .setColor('GREEN')
  .setTitle(':green_circle: Success')
  .setDescription(`${command} has been set to ${cosmetic.data.name} | ${cosmetic.data.id}`);
  message.channel.send(embed);
}

function error(command, message) {
  const embed = new Discord.MessageEmbed()
  .setColor('RED')
  .setTitle(':red_circle: Error')
  .setDescription(`No ${command} was found using current parameters.`)
  message.channel.send(embed);
}

function error2(message, error) {
  const embed = new Discord.MessageEmbed()
  .setColor('RED')
  .setTitle(':red_circle: Error')
  .setDescription(`An error has occured: ${error}.`)
  message.channel.send(embed);
}

function notReady(message) {
  const embed = new Discord.MessageEmbed()
  .setColor('RED')
  .setTitle(':red_circle: Error')
  .setDescription('Fortnite client is not in a party, wait until it is ready.')
  message.channel.send(embed);
}

discord.on('message', async message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;
  if (ownerOnly && !ownerIDs.includes(message.author.id)) return;

  const args = message.content.slice(prefix.length).trim().split(' ');
  const command = args.shift().toLowerCase();

  if (command === 'help') {
    const embed = new Discord.MessageEmbed()
    .setColor('RANDOM')
    .setTitle('Commands')
    .setDescription('For a list of commands, please visit [this](https://sirius-5.gitbook.io/sirius/commands) website for a list of commands.')
    message.channel.send(embed);
  }

  if (command === 'skin') {
    if (!fortnite.party) return notReady(message);
    const content = args.slice(0).join(' ');
    if (!content || content.length < 1) return message.channel.send('A valid parameter is required.');

    const cosmetic = await getCosmetic('AthenaCharacter', content);
    if (cosmetic.status === 404) return error('skin', message)
    fortnite.party.me.setOutfit(cosmetic.data.id);
    success('Skin', cosmetic, message);
  }

  if (command === 'backpack') {
    if (!fortnite.party) return notReady(message);
    const content = args.slice(0).join(' ');
    let cosmetic = await getCosmetic('AthenaBackpack', content);
    if (!content) {
      fortnite.party.me.setBackpack('None');
      return message.channel.send('Removed backpack.');
    }

    if (cosmetic.status === 404) return error('backpack', message);
    fortnite.party.me.setBackpack(cosmetic.data.id);
    success('Backpack', cosmetic, message);
  }

  if (command === 'emote') {
    if (!fortnite.party) return notReady(message);
    const content = args.slice(0).join(' ');
    if (!content || content.length < 1) { 
      fortnite.party.me.clearEmote();
      return message.channel.send('Emote cleared.');
    }

    const cosmetic = await getCosmetic('AthenaDance', content);
    if (cosmetic.status === 404) return error('emote', message);
    fortnite.party.me.setEmote(cosmetic.data.id);
    success('Emote', cosmetic, message);
  }

  if (command === 'pickaxe') {
    if (!fortnite.party) return notReady(message);
    const content = args.slice(0).join(' ');
    if (!content || content.length < 1) return message.channel.send('A valid parameter is required.');

    const cosmetic = await getCosmetic('AthenaPickaxe', content);
    if (cosmetic.status === 404) return error('pickaxe', message);
    fortnite.party.me.setPickaxe(cosmetic.data.id);
    success('Pickaxe', cosmetic, message);
  }

  if (command === 'variants') {
    if (!fortnite.party) return notReady(message);
    const cid = args[0];
    const channel = args[1];
    const variant = args[2];
    if (!cid || !channel || !variant) return message.channel.send(`Command usage: \`${prefix}variants CID CHANNEL VARIANT\`\nExample: \`${prefix}variants CID_029_Athena_Commando_F_Halloween Material Mat3\``);


    fortnite.party.me.setOutfit(cid, [{channel: channel, variant: variant}], [2, 350]);
    const embed = new Discord.MessageEmbed()
    .setColor('GREEN')
    .setTitle(':green_circle: Success')
    .setDescription(`Variants has been set to ${cid}, ${channel}, ${variant}`)
    message.channel.send(embed);
  }

  if (command === 'level') {
    if (!fortnite.party) return notReady(message);
    const level = args[0];
    if (!level || isNaN(level)) return message.channel.send('Please enter a *valid* level.');

    fortnite.party.me.setLevel(level);
    const embed = new Discord.MessageEmbed()
    .setColor('GREEN')
    .setTitle(':green_circle: Success')
    .setDescription(`Level has been set to ${level}.`)
    message.channel.send(embed);
  }

  if (command === 'bp' || command === 'battlepass') {
    if (!fortnite.party) return notReady(message);
    const battlepass = args.slice(0).join(' ');
    if (!battlepass || isNaN(battlepass)) return message.channel.send('Please enter a *valid* battlepass level.');

    fortnite.party.me.setBattlepass(true, parseInt(battlepass), 100, 100);
    const embed = new Discord.MessageEmbed()
    .setColor('GREEN')
    .setTitle(':green_circle: Success')
    .setDescription(`Battlepass level has been set to ${battlepass}`)
    message.channel.send(embed);
  }

  if (command === 'ready') {
   if (!fortnite.party) return notReady(message);
   fortnite.party.me.setReadiness(true);
   message.channel.send('Ready!');
  }

  if (command === 'unready') {
    if (!fortnite.party) return notReady(message);
    fortnite.party.me.setReadiness(false);
    message.channel.send('Unready!');
  }

  if (command === 'cid') {
    const cid = args[0];
    if (!cid) return message.channel.send('Please enter a *valid* CID.');

    fortnite.party.me.setOutfit(cid);
    const embed = new Discord.MessageEmbed()
    .setColor('GREEN')
    .setTitle(':green_circle: Success')
    .setDescription(`CID has been set to ${cid}!`)
    message.channel.send(embed);
  }

  if (command === 'kill') {
    console.log(`[SIRIUS] Destroyed Discord & Fortnite client.`);
    discord.destroy();
    fortnite.logout();
  }

  if (command === 'eid') {
    const eid = args[0];
    if (!eid) return message.channel.send('Please enter a *valid* EID.');;

    fortnite.party.me.setEmote(eid);
    const embed = new Discord.MessageEmbed()
    .setColor('GREEN')
    .setTitle(':green_circle: Success')
    .setDescription(`EID has been set to ${eid}!`)
    message.channel.send(embed);  }

  if (command === 'bid') {
    const bid = args[0];
    if (!bid) return message.channel.send('Please enter a *valid* BID.');

    fortnite.party.me.setBackpack(bid);
    const embed = new Discord.MessageEmbed()
    .setColor('GREEN')
    .setTitle(':green_circle: Success')
    .setDescription(`BID has been set to ${bid}!`)
    message.channel.send(embed);  }

  if (command === 'pickaxe_id') {
    const pickaxe = args[0];
    if (!pickaxe) return message.channel.send('Please enter a *valid* Pickaxe ID.');

    fortnite.party.me.setPickaxe(pickaxe);
    const embed = new Discord.MessageEmbed()
    .setColor('GREEN')
    .setTitle(':green_circle: Success')
    .setDescription(`Pickaxe ID has been set to ${pickaxe}!`)
    message.channel.send(embed);  }

  if (command === 'info') {
    if (!fortnite.party) return notReady(message);
    const skin = `${fortnite.party.me.outfit.split('\'')[0] ? fortnite.party.me.outfit.split('\'')[0] : 'None'}`;
    const pickaxe = `${fortnite.party.me.pickaxe.split('\'')[0] ? fortnite.party.me.pickaxe.split('\'')[0] : 'None'}`;
    const backpack = `${fortnite.party.me.backpack.split('\'')[0] ? fortnite.party.me.backpack.split('\'')[0] : 'None'}`;

    const incomingFriends = [];
    const outgoingFriends = [];

    fortnite.pendingFriends.forEach(friend => {
      if (friend.direction === 'INCOMING') incomingFriends.push(friend);
      if (friend.direction === 'OUTGOING') outgoingFriends.push(friend);
    });

    const embed = new Discord.MessageEmbed()
    .setColor('ORANGE')
    .setTitle('Client Information')
    .addField('Party', `Members: ${fortnite.party.members.size}\nLeader: ${fortnite.party.leader.displayName}`)
    .addField('Party Members', fortnite.party.members.map(o => `${o.displayName}`))
    .addField('Props', `Skin: ${skin}\nBackpack: ${backpack}\nEmote: ${fortnite.party.me.emote ? fortnite.party.me.emote : 'None'}\nPickaxe: ${pickaxe}\nReady: ${fortnite.party.me.isReady ? 'Yes' : 'No'}`)
    .addField('Client', `Name: ${fortnite.user.displayName}\nFriends: ${fortnite.friends.size}\nIncoming Friends: ${incomingFriends.length}\nOutgoing Friends: ${outgoingFriends.length}\nTotal: ${incomingFriends.length + outgoingFriends.length}\nBlocked: ${fortnite.blockedFriends.size}`);
    message.channel.send(embed);
  }

  if (command === 'matchmakingkey') {
    if (!fortnite.party) return notReady(message);
    const key = args.slice(0).join(' ');
    if (!key || !fortnite.party.me.isLeader) return message.channel.send('Please provide a valid key and or I must be party leader.');

    fortnite.party.setCustomMatchmakingKey(key);
    const embed = new Discord.MessageEmbed()
    .setColor('GREEN')
    .setTitle(':green_circle: Success')
    .setDescription(`Custom matchmaking key has been set to ${key}.`)
    message.channel.send(embed);
  }

  if (command === 'addfriend') {
    if (!fortnite.party) return notReady(message);
    const user = args.slice(0).join(' ');
    if (!user) return message.channel.send('Please provide an user.');

    fortnite.addFriend(user).then(friend => {
    const embed = new Discord.MessageEmbed()
    .setColor('GREEN')
    .setTitle(':green_circle: Success')
    .setDescription(`Friend request has been sent to ${user}.`)
    message.channel.send(embed);
    }).catch(error => {
      error2(message, error);
    });
  }

  if (command === 'removefriend' || command === 'unfriend') {
    if (!fortnite.party) return notReady(message);
    const user = args.slice(0).join(' ');
    if (!user) return message.channel.send('Please provide an user.');

    fortnite.removeFriend(user).then(friend => {
    const embed = new Discord.MessageEmbed()
    .setColor('GREEN')
    .setTitle(':green_circle: Success')
    .setDescription(`${user} has been unfriended.`)
    message.channel.send(embed);
    }).catch(error => {
      error2(message, error);
    });
  }

  if (command === 'block') {
    if (!fortnite.party) return notReady(message);
    const user = args.slice(0).join(' ');
    if (!user) return message.channel.send('Please provide an user.');

    fortnite.blockFriend(user).then(blocked => {
      const embed = new Discord.MessageEmbed()
      .setColor('GREEN')
      .setTitle(':green_circle: Success')
      .setDescription(`${user} has been blocked.`)
      message.channel.send(embed);
    }).catch(error => {
      error2(message, error);
    });
  }

  if (command === 'unblock') {
    if (!fortnite.party) return notReady(message);
    const user = args.slice(0).join(' ');
    if (!user) return message.channel.send('Please provide an user.');

    fortnite.unblockFriend(user).then(unblocked => {
      const embed = new Discord.MessageEmbed()
      .setColor('GREEN')
      .setTitle(':green_circle: Success')
      .setDescription(`${user} has been unblocked.`)
      message.channel.send(embed);
    }).catch(error => {
      error2(message, error);
    });
  }

  if (command === 'invite') {
    if (!fortnite.party) return notReady(message);
    const user = args.slice(0).join(' ');
    if (!user) return message.channel.send('Please provide an user.');

    fortnite.party.invite(user).then(invited => {
      const embed = new Discord.MessageEmbed()
      .setColor('GREEN')
      .setTitle(':green_circle: Success')
      .setDescription(`${user} has been invited.`)
      message.channel.send(embed);
    }).catch(error => {
      error2(message, error);
    });
  }

  if (command === 'join') {
    if (!fortnite.party) return notReady(message);
    const user = args.slice(0).join(' ');
    if (!user) return message.channel.send('Please provide an user.');

    fortnite.friends.forEach(friend => {
      if (friend.displayName === user) {
    friend.joinParty().then(invited => {
      const embed = new Discord.MessageEmbed()
      .setColor('GREEN')
      .setTitle(':green_circle: Success')
      .setDescription(`Joined ${user}'s party.`)
      message.channel.send(embed);
    }).catch(error => {
      error2(message, error);
    });
      }
    })
  }

  if (command === 'send' || command === 'say') {
    const content = args.slice(0).join(' ');
    fortnite.party.sendMessage(content);
    message.channel.send('Successfully sent message!');
  }

  if (command === 'pinkghoul') {
    if (!fortnite.party) return notReady(message);
    fortnite.party.me.setOutfit('CID_029_Athena_Commando_F_Halloween', [{ channel: 'Material', variant: 'Mat3'}]);

    const embed = new Discord.MessageEmbed()
    .setColor('GREEN')
    .setTitle(':green_circle: Success')
    .setDescription('Equipped Ghoul Trooper with pink variant.')
    message.channel.send(embed);
  }

  if (command === 'purpleskull') {
    if (!fortnite.party) return notReady(message);
    fortnite.party.me.setOutfit('CID_030_Athena_Commando_M_Halloween', [{ channel: 'ClothingColor', variant: 'Mat1'}]);

    const embed = new Discord.MessageEmbed()
    .setColor('GREEN')
    .setTitle(':green_circle: Success')
    .setDescription('Equipped Skull Trooper with purple variant.')
    message.channel.send(embed);
  }

  if (command === 'hologram') {
    if (!fortnite.party) return notReady(message);
    fortnite.party.me.setOutfit('CID_VIP_Athena_Commando_M_GalileoGondola_SG');

    const embed = new Discord.MessageEmbed()
    .setColor('GREEN')
    .setTitle(':green_circle: Success')
    .setDescription('Equipped the Hologram skin from the Star Wars event.')
    message.channel.send(embed);
  }

  if (command === 'nohatrecon') {
    if (!fortnite.party) return notReady(message);
    fortnite.party.me.setOutfit('CID_022_Athena_Commando_F', [{ channel: 'Parts', variant: 'Stage2' }]);

    const embed = new Discord.MessageEmbed()
    .setColor('GREEN')
    .setTitle(':green_circle: Success')
    .setDescription('Equipped Recon Expert with no hat variant.')
    message.channel.send(embed);
  }

  if (command === 'golden') {
    if (!fortnite.party) return notReady(message);
    const character = args.slice(0).join(' ');
    if (!character) return message.channel.send('Must provide a character');

    let skin;
    let variant;
    let name;

    switch (character.toLowerCase()) {
      case 'peely':
        name = 'Agent Peely';
        skin = 'CID_701_Athena_Commando_M_BananaAgent';
        variant = 'Stage4';
        break;
      case 'meowscles':
        name = 'Meowscles';
        skin = 'CID_693_Athena_Commando_M_BuffCat';
        variant = 'Stage4';
        break;
      case 'tntina':
        name = 'TNTina';
        skin = 'CID_691_Athena_Commando_F_TNTina';
        variant = 'Stage7';
        break;
      case 'midas':
        name = 'Midas';
        skin = 'CID_694_Athena_Commando_M_CatBurglar';
        variant = 'Stage4';
        break;
      case 'brutus':
        name = 'Brutus';
        skin = 'CID_692_Athena_Commando_M_HenchmanTough';
        variant = 'Stage4';
      case 'skye':
        name = 'Skye';
        skin = 'CID_690_Athena_Commando_F_Photographer';
        variant = 'Stage4'
        break;
      default:
        return message.channel.send(`${character} is not a valid skin.\n\nValid skins: \`peely, meowscles, tntina, midas, brutus, skye\``);
    }

    fortnite.party.me.setOutfit(skin, [{channel: 'Progressive', variant: variant}], [2, 350]);

    const embed = new Discord.MessageEmbed()
    .setColor('GREEN')
    .setTitle(':green_circle: Success')
    .setDescription(`Equipped ${name} with golden agent variant.`)
    message.channel.send(embed);
  }

  if (command === 'season') {
    if (!fortnite.party) return notReady(message);
    const season = args[0];
    if (!season || isNaN(season) || season <= 0 || season > 14) return message.channel.send('Must provide a number; season number must be greater than 0; season number must be less than current season.');

    let skin;
    let name;

    switch (season) {
      case '1':
        name = 'Renegade Raider';
        skin = 'CID_028_Athena_Commando_F';
        break;
      case '2':
        name = 'Black Knight'
        skin = 'CID_035_Athena_Commando_M_Medieval';
        break;
      case '3':
        name = 'The Reaper'
        skin = 'CID_084_Athena_Commando_M_Assassin';
        break;
      case '4':
        name = 'Omega'
        skin = 'CID_116_Athena_Commando_M_CarbideBlack';
        break;
      case '5':
        name = 'Ragnarok';
        skin = 'CID_165_Athena_Commando_M_DarkViking';
        break;
      case '6':
        name = 'Dire';
        skin = 'CID_230_Athena_Commando_M_Werewolf';
        break;
      case '7':
        name = 'The Ice King';
        skin = 'CID_288_Athena_Commando_M_IceKing';
        break;
      case '8':
        name = 'Luxe';
        skin = 'CID_352_Athena_Commando_F_Shiny';
        break;
      case '9':
        name = 'Vendetta';
        skin = 'CID_407_Athena_Commando_M_BattleSuit';
        break;
      case '10':
        name = 'Ultima Knight';
        skin = 'CID_484_Athena_Commando_M_KnightRemix';
        break;
      case '11':
        name = 'Fusion';
        skin = 'CID_572_Athena_Commando_M_Viper';
        break;
      case '12':
        name = 'Midas';
        skin = 'CID_694_Athena_Commando_M_CatBurglar';
        break;
      case '13':
        name = 'Eternal Knight';
        skin = 'CID_767_Athena_Commando_F_BlackKnight';
        break;
      case '14':
        name = 'Tony Stark';
        skin = 'CID_843_Athena_Commando_M_HightowerTomato_Casual';
        break;
    }

    fortnite.party.me.setOutfit(skin);
    const embed = new Discord.MessageEmbed()
    .setColor('GREEN')
    .setTitle(':green_circle: Success')
    .setDescription(`Equipped ${name}, season ${season}'s max tier skin.`)
    message.channel.send(embed);
  }

  if (command === 'kick') {
    if (!fortnite.party) return notReady(message);
    const user = args.slice(0).join(' ');
    if (!user || !fortnite.party.me.isLeader) return message.channel.send('Missing user; or i am not party leader.');

    fortnite.party.kick(user).then(kicked => {
      const embed = new Discord.MessageEmbed()
      .setColor('GREEN')
      .setTitle(':green_circle: Success')
      .setDescription(`${user} has been kicked from the party.`)
      message.channel.send(embed);
    }).catch(error => {
      error2(message, error);
    });
  }

  if (command === 'promote') {
    if (!fortnite.party) return notReady(message);
    const user = args.slice(0).join(' ');
    if (!user || !fortnite.party.me.isLeader) return message.channel.send('Missing user; or i am not party leader.');

    fortnite.party.promote(user).then(promoted => {
      const embed = new Discord.MessageEmbed()
      .setColor('GREEN')
      .setTitle(':green_circle: Success')
      .setDescription(`${user} has been promoted to party leader.`)
      message.channel.send(embed);
    }).catch(error => {
      error2(message, error);
    });
  }

  if (command === 'defaultset') {
    if (!fortnite.party) return notReady(message);
    fortnite.party.me.setOutfit(cid);
    fortnite.party.me.setBackpack(bid);
    fortnite.party.me.setEmote(eid);
    fortnite.party.me.setPickaxe(pickaxeId);
    const embed = new Discord.MessageEmbed()
    .setColor('GREEN')
    .setTitle(':green_circle: Success')
    .setDescription('Set from config has been loaded.')
    message.channel.send(embed);
  }

  if (command === 'gift') {
    if (!fortnite.party) return notReady(message);
    fortnite.party.me.clearEmote();
    fortnite.party.me.setEmote('EID_NeverGonna');

    message.channel.send('You thought i\'m going to gift you? Shame on you. :rofl:\n\nBut for real, watch this nice video: <https://www.youtube.com/watch?v=dQw4w9WgXcQ>. (believe me, it\'s real nice)');
  }

  if (command === 'floss') {
    if (!fortnite.party) return notReady(message);
    fortnite.party.me.clearEmote();
    fortnite.party.me.setEmote('EID_Floss');

    const embed = new Discord.MessageEmbed()
    .setColor('GREEN')
    .setTitle(':green_circle: Success')
    .setDescription('Equipped Floss.')
    message.channel.send(embed);
  }

  if (command === 'fortknight') {
     if (!fortnite.party) return notReady(message);
     fortnite.party.me.setOutfit('CID_035_Athena_Commando_M_Medieval');
     fortnite.party.me.setBackpack('BID_004_BlackKnight');
     fortnite.party.me.setPickaxe('Pickaxe_Medieval');
     const embed = new Discord.MessageEmbed()
    .setColor('GREEN')
    .setTitle(':green_circle: Success')
    .setDescription('Equipped all items in the Fort Knights set.')
    message.channel.send(embed);
  }

  if (command === 'henchman') {
    if (!fortnite.party) return notReady(message);
    const henchmans = ['CID_794_Athena_Commando_M_HenchmanBadShorts_D', 'CID_NPC_Athena_Commando_F_HenchmanSpyDark', 'CID_791_Athena_Commando_M_HenchmanGoodShorts_D', 'CID_780_Athena_Commando_M_HenchmanBadShorts', 'CID_NPC_Athena_Commando_M_HenchmanGood', 'CID_692_Athena_Commando_M_HenchmanTough', 'CID_707_Athena_Commando_M_HenchmanGood', 'CID_792_Athena_Commando_M_HenchmanBadShorts_B', 'CID_793_Athena_Commando_M_HenchmanBadShorts_C', 'CID_NPC_Athena_Commando_M_HenchmanBad', 'CID_790_Athena_Commando_M_HenchmanGoodShorts_C', 'CID_779_Athena_Commando_M_HenchmanGoodShorts', 'CID_NPC_Athena_Commando_F_RebirthDefault_Henchman', 'CID_NPC_Athena_Commando_F_HenchmanSpyGood', 'CID_706_Athena_Commando_M_HenchmanBad', 'CID_789_Athena_Commando_M_HenchmanGoodShorts_B'];
    const henchman = Math.floor(Math.random() * henchmans.length);

    fortnite.party.me.setOutfit(henchmans[henchman]);
    const embed = new Discord.MessageEmbed()
    .setColor('GREEN')
    .setTitle(':green_circle: Success')
    .setDescription(`Equipped a random Henchman: ${henchmans[henchman]}.`)
    message.channel.send(embed);
  }

  if (command === 'marauder') {
    if (!fortnite.party) return notReady(message);
    const marauders = ['CID_NPC_Athena_Commando_M_MarauderHeavy', 'CID_NPC_Athena_Commando_M_MarauderElite', 'CID_NPC_Athena_Commando_M_MarauderGrunt'];
    const marauder = Math.floor(Math.random() * marauders.length);

    fortnite.party.me.setOutfit(marauders[marauder]);
    const embed = new Discord.MessageEmbed()
    .setColor('GREEN')
    .setTitle(':green_circle: Success')
    .setDescription(`Equipped a random Marauder: ${marauders[marauder]}`)
    message.channel.send(embed);
  }

  if (command === 'point') {
    if (!fortnite.party) return notReady(message);
    let pickaxe = args.slice(0).join(' ');
    if (!pickaxe) { 
      fortnite.party.me.setEmote('EID_IceKing');

    const embed = new Discord.MessageEmbed()
    .setColor('GREEN')
    .setTitle(':green_circle: Success')
    .setDescription(`Emote has been set to Point It Out.`)
    return message.channel.send(embed);
    }

    fortnite.party.me.setPickaxe(pickaxe);
    fortnite.party.me.setEmote('EID_IceKing');
    const embed = new Discord.MessageEmbed()
    .setColor('GREEN')
    .setTitle(':green_circle: Success')
    .setDescription(`Equipped ${pickaxe} & emote set to Point It Out`)
    message.channel.send(embed);
  }

  if (command === 'leave') {
    if (!fortnite.party) return notReady(message);

    fortnite.party.leave(true);
    const embed = new Discord.MessageEmbed()
    .setColor('GREEN')
    .setTitle(':green_circle: Success')
    .setDescription(`Left the current party.`)
    message.channel.send(embed);
  }

});

fortnite.on('party:invite', (invite) => {
  console.log(`[SIRIUS] [FORTNITE] Received a party invitation from ${invite.sender.displayName}`);
  if (acceptInvite) { 
    invite.accept();
  } else {
    invite.decline();
  }
   console.log(`[SIRIUS] [FORTNITE] Invite from ${invite.sender.displayName} has been ${acceptInvite ? 'accepted' : 'declined'}.`);
});

fortnite.on('friend:request', (request) => {
  console.log(`[SIRIUS] [FORTNITE] Received a friend request from ${request.displayName}`);

  if (acceptFriend) {
    request.accept();
  } else {
    request.decline();
  }
  console.log(`[SIRIUS] [FORTNITE] Friend request from ${request.displayName} has been ${acceptFriend ? 'accepted' : 'declined'}`);
});

fortnite.on('ready', () => {
  fortnite.party.me.setOutfit(cid);
  fortnite.party.me.setEmote(eid);
  fortnite.party.me.setBackpack(bid);
  fortnite.party.me.setPickaxe(pickaxeId);
  fortnite.party.me.setBattlepass(true, parseInt(bp), 100, 100);
  fortnite.party.me.setLevel(parseInt(level));

  const content = discordStatus;
  const a = content.replace('%ClientUserDisplayName%', fortnite.user.displayName).replace('%PartyMemberCount%', fortnite.party.members.size).replace('%ClientPartyUserOutfit%', fortnite.party.me.outfit)
  .replace('%ClientPartyUserPickaxe%', fortnite.party.me.pickaxe).replace('%ClientPartyUserEmote%', fortnite.party.me.emote).replace('%ClientPartyUserBackpack%', fortnite.party.me.backpack)
  .replace('%ClientPartyUserIsReady%', fortnite.party.me.isReady).replace('%ClientPartyUserIsLeader%', fortnite.party.me.isLeader).replace('%ClientUserID%', fortnite.id)

  discord.user.setStatus(discordUserStatus)

  setInterval(function() {
    discord.user.setActivity(a, { type: discordStatusType});
  }, 10000)
});

fortnite.on('message', message => {
  console.log(`[SIRIUS] [FORTNITE] Message from ${message.sender.displayName}: ${message.content}`);
});

fortnite.on('friend:added', friend => {
  console.log(`[SIRIUS] [FORTNITE] ${friend.displayName} has been added to your friend list.`);
});

fortnite.on('friend:removed', friend => {
  console.log(`[SIRIUS] [FORTNITE] ${friend.displayName} has been removed from your friend list.`);
});

fortnite.on('party:member:joined', partyMember => {
  const message = customJoinMessage.replace('%Member%', partyMember.displayName);
  fortnite.party.sendMessage(message);
});

  if (token !== 'TOKEN') { 
    discord.login(token); 
  } else {
    return console.log(`[SIRIUS] [DISCORD] Please provide a valid token in config.json`);
  }

  fortnite.on('deviceauth:created', (content) => writeFile('./deviceAuth.json', JSON.stringify(content, null, 2)));

  await fortnite.login();
  discord.login(token)
  if (fortnite.user.displayName) console.log(`[SIRIUS] [FORTNITE] Client ready as ${fortnite.user.displayName}.`);
  if (discord.user.tag) console.log(`[SIRIUS] [DISCORD] Client ready as ${discord.user.tag}.`);
})();
