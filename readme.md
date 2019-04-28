# BigEmoji

Chat with big :emoji: includes custom and default one in slack.

![emoji](https://www.webfx.com/tools/emoji-cheat-sheet/graphics/emojis/laughing.png)

this bot manages user token itself and any user can register/unregister bot within bot's framework.


type pattern; `/stamp :emoji:`


# Framework
nodejs, firebase(Cloud Functions, Firestore)

# Firestore node tree
firestore is used to save user token for manage permission and switch on-off of the bot.
```
- emoji_user_token
     |- {userId}
           |- token: {String}
- registered 
     |- {userId}
           |- channel: {String}
              enabled: {boolean}
              user: {String}
```

# Slack Config
###### Interactive Components
- enable Interactive Components, set Request URL; `{FUNCTION_URL}/widgets/unregisterEmoji`

###### Slash Commands
- Command: `/stamp`
- URL: `{FUNCTION_URL}/widgets/bigEmoji`

###### OAuth & Permissions
- Redirect URLs: `{FUNCTION_URL}/widgets/bigEmojiAuthRedirected`
- Scopes: chat:write:user, im:history, im:read, im:write, emoji:read, bot, commands
###### Event Subscriptions
- Request URL: `{FUNCTION_URL}/widgets/bigEmojiEvent`
- Subscribe to Bot Events: message.im
