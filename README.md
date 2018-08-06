# node-pinterest-bot


####  *Example


```javascript

async function main() {
    let defaults = {
        debug: true,
        mail: 'veryStrong@mail',
        username: "veryStrongUsername",
        password: "veryStrongPass",


    };
    let pinbot     = new PinBot(defaults);
    await pinbot.auth();

    let followers     = await pinbot.board().followers("300826518798656131", 0);

   
}
main();


```
