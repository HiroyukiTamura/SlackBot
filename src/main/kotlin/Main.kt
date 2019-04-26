external fun require(module:String):dynamic

fun main(args: Array<String>) {
    println("Hello JavaScript!")

    val admin = require("firebase-admin")
    val serviceAccount = require("../slackbot-6314b-firebase-adminsdk-tapy4-9aaa95851d.json")

    val option = mapOf(
        "credential" to admin.credential.cert(serviceAccount),
        "databaseURL" to "https://slackbot-6314b.firebaseio.com"
    )

    admin.initializeApp(option)
}