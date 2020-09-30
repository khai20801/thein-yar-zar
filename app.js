'use strict';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const APP_URL = "https://newhope-grocery-store.herokuapp.com";


//new text

// Imports dependencies and set up http server
const
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser'),
  firebase = require("firebase-admin"),
  app = express();

// parse application/x-www-form-urlencoded
app.use(body_parser.json());
app.use(body_parser.urlencoded());


var firebaseConfig = {
  credential: firebase.credential.cert({
    "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    "project_id": process.env.FIREBASE_PROJECT_ID,
  }),
  databaseURL: process.env.FIREBASE_DB_URL
};



firebase.initializeApp(firebaseConfig);

let db = firebase.firestore();



// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {

  // Parse the request body from the POST
  let body = req.body;



  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {
    body.entry.forEach(function (entry) {

      let webhook_event = entry.messaging[0];
      let sender_psid = webhook_event.sender.id;

      if (webhook_event.message) {
        if (webhook_event.message.quick_reply) {
          handleQuickReply(sender_psid, webhook_event.message.quick_reply.payload);
        } else {
          handleMessage(sender_psid, webhook_event.message);
        }
      } else if (webhook_event.postback) {
        handlePostback(sender_psid, webhook_event.postback);
      }

    });
    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});


//Set up Get Started Button. To run one time
//eg https://newhope-grocery-store.herokuapp.com/setgsbutton
app.get('/setgsbutton', function (req, res) {
  setupGetStartedButton(res);
});

//Set up Persistent Menu. To run one time
//eg https://newhope-grocery-store.herokuapp.com/setpersistentmenu
app.get('/setpersistentmenu', function (req, res) {
  setupPersistentMenu(res);
});

//Remove Get Started and Persistent Menu. To run one time
//eg https://newhope-grocery-store.herokuapp.com/clear
app.get('/clear', function (req, res) {
  removePersistentMenu(res);
});

//whitelist domains
//eg https://newhope-grocery-store.herokuapp.com/whitelists
app.get('/whitelists', function (req, res) {
  whitelistDomains(res);
});


// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {


  const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Check token and mode
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

/**********************************************
Function to Handle when user send text message
***********************************************/

const handleMessage = (sender_psid, received_message) => {
  let user_message = received_message.text.toLowerCase();

  switch (user_message) {
    case "hi":
      greetUser(sender_psid);
      break;
    case "!admin":
      admin(sender_psid);
      break;
    case "chicken":
      chicken(sender_psid);
      break;
    case "pork":
      pork(sender_psid);
      break;
    case "fish":
      fish(sender_psid);
      break;
    case "beef":
      beef(sender_psid);
      break;
    case "seafood":
      seafood(sender_psid);
      break;
    default:
      defaultReply(sender_psid);
  }
}

/*********************************************
Function to handle when user click button
**********************************************/
const handlePostback = (sender_psid, received_postback) => {
  let payload = received_postback.payload;

  switch (payload) {
    case "get_started":
      getStarted(sender_psid);
      break;
    case "mm-lan":
      greetUser(sender_psid);
      break;
    case "chat-with-admin":
      chatWithAdmin(sender_psid);
      break;
    case "search-meals":
      searchMeals(sender_psid);
      break;
    case "today-meals":
      todayMeals(sender_psid);
      break;
    case "pop-meals":
      popMeals(sender_psid);
      break;
    case "search-by-category":
      searchByCategory(sender_psid);
      break;
      // chicken
    case "ch-one-ingre":
      chOneIngre(sender_psid);
      break;
    case "ch-two-ingre":
      chTwoIngre(sender_psid);
      break;
    case "ch-three-ingre":
      chThreeIngre(sender_psid);
      break;
    case "ch-four-ingre":
      chFourIngre(sender_psid);
      break;
    case "ch-five-ingre":
      chFiveIngre(sender_psid);
      break;
    case "ch-one-how-to":
      chOneHowTo(sender_psid);
      break;
    case "ch-two-how-to":
      chTwoHowTo(sender_psid);
      break;
    case "ch-three-how-to":
      chThreeHowTo(sender_psid);
      break;
    case "ch-four-how-to":
      chFourHowTo(sender_psid);
      break;
    case "ch-five-how-to":
      chFiveHowTo(sender_psid);
      break;
      // pork
    case "pork-one-ingre":
      porkOneIngre(sender_psid);
      break;
    case "pork-two-ingre":
      porkTwoIngre(sender_psid);
      break;
    case "pork-three-ingre":
      porkThreeIngre(sender_psid);
      break;
    case "pork-four-ingre":
      porkFourIngre(sender_psid);
      break;
    case "pork-five-ingre":
      porkFiveIngre(sender_psid);
      break;
    case "pork-one-how-to":
      porkOneHowTo(sender_psid);
      break;
    case "pork-two-how-to":
      porkTwoHowTo(sender_psid);
      break;
    case "pork-three-how-to":
      porkThreeHowTo(sender_psid);
      break;
    case "pork-four-how-to":
      porkFourHowTo(sender_psid);
      break;
    case "pork-five-how-to":
      porkFiveHowTo(sender_psid);
      break;
      // fish
    case "fish-one-ingre":
      fishOneIngre(sender_psid);
      break;
    case "fish-two-ingre":
      fishTwoIngre(sender_psid);
      break;
    case "fish-three-ingre":
      fishThreeIngre(sender_psid);
      break;
    case "fish-one-how-to":
      fishOneHowTo(sender_psid);
      break;
    case "fish-two-how-to":
      fishTwoHowTo(sender_psid);
      break;
    case "fish-three-how-to":
      fishThreeHowTo(sender_psid);
      break;
      // seafood
    case "sf-one-ingre":
      sfOneIngre(sender_psid);
      break;
    case "sf-two-ingre":
      sfTwoIngre(sender_psid);
      break;
    case "sf-three-ingre":
      sfThreeIngre(sender_psid);
      break;
    case "sf-one-how-to":
      sfOneHowTo(sender_psid);
      break;
    case "sf-two-how-to":
      sfTwoHowTo(sender_psid);
      break;
    case "sf-three-how-to":
      sfThreeHowTo(sender_psid);
      break;
    default:
      defaultReply(sender_psid);
  }
}

/****************************************************
Function to Handle when user send quick reply message
*****************************************************/

function handleQuickReply(sender_psid, received_message) {

  switch (received_message) {
    case "chicken":
      chicken(sender_psid);
      break;
    case "pork":
      pork(sender_psid);
      break;
    case "fish":
      fish(sender_psid);
      break;
    case "beef":
      beef(sender_psid);
      break;
    case "sea-food":
      seafood(sender_psid);
      break;
    case "main-menu":
      greetUser(sender_psid);
      break;
    default:
      defaultReply(sender_psid);
  }

}

/* FUNCTION TO GETSTARTED */
async function getStarted(sender_psid) {
  let user = await getUserProfile(sender_psid);
  let response = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "Hi " + user.first_name + " " + user.last_name + ". Welcome to New Hope Grocery Store.\n\n🇲🇲 မိမိနှစ်သက်ရာဘာသာစကားကိုရွေးပါ။\n\n🇺🇸 Please choose the language below.",
        "buttons": [{
            "type": "postback",
            "title": "မြန်မာ",
            "payload": "mm-lan"
          },
          {
            "type": "postback",
            "title": "English",
            "payload": "eng-lan"
          }
        ]
      }
    }
  }
  callSend(sender_psid, response);
}

/*FUNCTION TO GREET USER*/
async function greetUser(sender_psid) {
  let response1 = {
    "text": "မင်္ဂလာပါခင်ဗျ။\nNew Hope Grocery Store မှ ကြိုဆိုပါတယ်။ 🙂 "
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိမှာယူထားသော ပစ္စည်းများကိုကြည့်ရန် 'မှာယူမှုမှတ်တမ်းများ' ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ကြည့်နိုင်ပါတယ်ခင်ဗျ 😉",
        "buttons": [{
            "type": "postback",
            "title": "Admin နဲ့ Chat မယ်",
            "payload": "chat-with-admin"
          },
          {
            "type": "postback",
            "title": "ဟင်းပွဲရှာမယ်",
            "payload": "search-meals"
          },
          {
            "type": "web_url",
            "title": "မှာယူမှုမှတ်တမ်းများ",
            "url": "https://new-hope-a1a0b.web.app/my/orders",
            "webview_height_ratio": "full",
            "messenger_extensions": true,
          }
        ]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

const chatWithAdmin = (sender_psid) => {
  let response;
  response = {
    "text": "အမှာစကားချန်ထားပေးခဲ့ပါ။\n၂၄နာရီအတွင်းပြန်လည်ဖြေကြားပေးပါမယ်ခင်ဗျ 😉"
  }
  callSend(sender_psid, response);
}

const defaultReply = (sender_psid) => {
  let response1 = {
    "text": "ကြက်သားဟင်းပွဲများရှာဖွေရန်အတွက် 'chicken' ဟုရိုက်ပါ။"
  };
  let response2 = {
    "text": "ဝက်သားဟင်းပွဲများရှာဖွေရန်အတွက် 'pork' ဟုရိုက်ပါ။"
  };
  let response3 = {
    "text": "ငါးဟင်းပွဲများရှာဖွေရန်အတွက် 'fish' ဟုရိုက်ပါ။"
  };
  let response4 = {
    "text": "အမဲသားဟင်းပွဲများရှာဖွေရန်အတွက် 'beef' ဟုရိုက်ပါ။"
  };
  let response5 = {
    "text": "ပင်လယ်စာဟင်းပွဲများရှာဖွေရန်အတွက် 'seafood' ဟုရိုက်ပါ။"
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2).then(() => {
      return callSend(sender_psid, response3).then(() => {
        return callSend(sender_psid, response4).then(() => {
          return callSend(sender_psid, response5);
        });
      });
    });
  });
}

/* FUNCTION TO ADMIN */
const admin = (sender_psid) => {
  let response;
  response = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
            "title": "View Orders",
            "buttons": [{
              "type": "web_url",
              "title": "view",
              "url": "https://new-hope-a1a0b.web.app/admin/orders",
              "webview_height_ratio": "full",
              "messenger_extensions": true,
            }]
          },
          {
            "title": "Meals Management",
            "buttons": [{
                "type": "web_url",
                "title": "view",
                "url": "https://new-hope-a1a0b.web.app/admin/meals",
                "webview_height_ratio": "full",
                "messenger_extensions": true,
              },
              {
                "type": "web_url",
                "title": "create",
                "url": "https://new-hope-a1a0b.web.app/admin/meals/new",
                "webview_height_ratio": "full",
                "messenger_extensions": true,
              }
            ]
          },
          {
            "title": "Ingredients Management",
            "buttons": [{
                "type": "web_url",
                "title": "view",
                "url": "https://new-hope-a1a0b.web.app/admin/ingredients",
                "webview_height_ratio": "full",
                "messenger_extensions": true,
              },
              {
                "type": "web_url",
                "title": "create",
                "url": "https://new-hope-a1a0b.web.app/admin/ingredients/new",
                "webview_height_ratio": "full",
                "messenger_extensions": true,
              }
            ]
          }
        ]
      }
    }
  }
  callSend(sender_psid, response);
}

/* FUNCTION TO SEARCH MEALS */
const searchMeals = (sender_psid) => {
  let response;
  response = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "“ကြက်သား ဝက်သား ငါး,…” စသည့်အကြောင်းအရာများအားဖြင့် ရှာဖွေနိုင်ပါတယ်။ \n\nယနေ့အတွက် ဟင်းပွဲတွေအကြောင်းနှင့် လတ်တလော လူစိတ်ဝင်စားမှုများသောဟင်းပွဲများအကြောင်းသိချင်ပါသလား။ \n\nအောက်က Button လေးတွေကို နှိပ်ပြီး ရှာဖွေနိုင်ပါတယ်။",
        "buttons": [{
            "type": "postback",
            "title": "ဒီနေ့အတွက်ဟင်းပွဲများ",
            "payload": "today-meals"
          },
          {
            "type": "postback",
            "title": "ဟော့နေသည့်ဟင်းပွဲများ",
            "payload": "pop-meals"
          },
          {
            "type": "postback",
            "title": "Category နဲ့ရှာမယ်",
            "payload": "search-by-category"
          }
        ]
      }
    }
  };
  callSend(sender_psid, response);
}

const todayMeals = (sender_psid) => {
  let response1 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
            "title": "ကြက်ဥကြော်နှပ်",
            "image_url": "https://firebasestorage.googleapis.com/v0/b/new-hope-a1a0b.appspot.com/o/%E1%80%80%E1%80%BC%E1%80%80%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%2F%E1%80%80%E1%80%BC%E1%80%80%E1%80%BA%E1%80%A5%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA%E1%80%94%E1%80%BE%E1%80%95%E1%80%BA_1588502464494?alt=media&token=6bec9703-435b-478f-9f58-8dfc306be98e",
            "subtitle": "ဘယ်သူမဆိုဒီလိုပူအိုက်တဲ့ရာသီမှာအနှစ်ပါတဲ့ဟင်းတွေ၊ဆီပါတဲ့ဟင်းတွေကိုစားချင်ကြမှာမဟုတ်ဘူး။ဒီဟင်းပွဲလေးကတော့ ထမင်းဖြူလေးနဲ့နယ်ဖတ်စားရင်တောင်အရသာရှိမှာအမှန်ပါပဲ။",
            "buttons": [{
                "type": "postback",
                "title": "ပါဝင်ပစ္စည်းများ",
                "payload": "ch-two-ingre"
              },
              {
                "type": "postback",
                "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
                "payload": "ch-two-how-to"
              },

              {
                "type": "web_url",
                "url": "https://new-hope-a1a0b.web.app/meals/2L7hx52K7Fd4pTkgfvjC?meal=%E1%80%80%E1%80%BC%E1%80%80%E1%80%BA%E1%80%A5%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA%E1%80%94%E1%80%BE%E1%80%95%E1%80%BA",
                "title": "ဝယ်မယ်",
                "webview_height_ratio": "full",
                "messenger_extensions": true,
              }
            ]
          },
          {
            "title": "ကဗျာလွတ်ကုန်းဘောင်ကြော်",
            "image_url": "https://firebasestorage.googleapis.com/v0/b/new-hope-a1a0b.appspot.com/o/%E1%80%9D%E1%80%80%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%2F%E1%80%80%E1%80%97%E1%80%BB%E1%80%AC%E1%80%9C%E1%80%BD%E1%80%90%E1%80%BA%E1%80%80%E1%80%AF%E1%80%94%E1%80%BA%E1%80%B8%E1%80%98%E1%80%B1%E1%80%AC%E1%80%84%E1%80%BA%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA.jpeg?alt=media&token=d3d25a4b-8ba1-42bb-88b7-27fa293cc474",
            "subtitle": "ဒီဟင်းပွဲအတွက်မည်သည့်အသားကိုမဆိုအသုံးပြုနိူင်ပါတယ်။ ကြက်၊ ဝက်၊ အမဲ၊ဆိတ်။ ကျွန်တော်က ဝက်လိုင်းသားလေးအသုံးပြုထားပါတယ်။",
            "buttons": [{
                "type": "postback",
                "title": "ပါဝင်ပစ္စည်းများ",
                "payload": "pork-two-ingre"
              }, {
                "type": "postback",
                "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
                "payload": "pork-two-how-to"
              },
              {
                "type": "web_url",
                "url": "https://new-hope-a1a0b.web.app/meals/fZllELy9hfhmjlU3UKUb?meal=%E1%80%80%E1%80%97%E1%80%BB%E1%80%AC%E1%80%9C%E1%80%BD%E1%80%90%E1%80%BA%E1%80%80%E1%80%AF%E1%80%94%E1%80%BA%E1%80%B8%E1%80%98%E1%80%B1%E1%80%AC%E1%80%84%E1%80%BA%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA",
                "title": "ဝယ်မယ်",
                "webview_height_ratio": "full",
                "messenger_extensions": true,
              }
            ]
          }
        ]
      }
    }
  };
  let response2 = {
    "text": "Main Menu သို့ပြန်သွားလိုပါသလားခင်ဗျာ။",
    "quick_replies": [{
      "content_type": "text",
      "title": "အစသို့ပြန်သွားရန်",
      "image_url": "https://i.imgur.com/YT1qtmF.png",
      "payload": "main-menu"
    }]
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

const popMeals = (sender_psid) => {
  let response1 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
            "title": "ကဗျာလွတ်ကုန်းဘောင်ကြော်",
            "image_url": "https://firebasestorage.googleapis.com/v0/b/new-hope-a1a0b.appspot.com/o/%E1%80%9D%E1%80%80%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%2F%E1%80%80%E1%80%97%E1%80%BB%E1%80%AC%E1%80%9C%E1%80%BD%E1%80%90%E1%80%BA%E1%80%80%E1%80%AF%E1%80%94%E1%80%BA%E1%80%B8%E1%80%98%E1%80%B1%E1%80%AC%E1%80%84%E1%80%BA%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA.jpeg?alt=media&token=d3d25a4b-8ba1-42bb-88b7-27fa293cc474",
            "subtitle": "ဒီဟင်းပွဲအတွက်မည်သည့်အသားကိုမဆိုအသုံးပြုနိူင်ပါတယ်။ ကြက်၊ ဝက်၊ အမဲ၊ဆိတ်။ ကျွန်တော်က ဝက်လိုင်းသားလေးအသုံးပြုထားပါတယ်။",
            "buttons": [{
                "type": "postback",
                "title": "ပါဝင်ပစ္စည်းများ",
                "payload": "pork-two-ingre"
              },
              {
                "type": "postback",
                "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
                "payload": "pork-two-how-to"
              },
              {
                "type": "web_url",
                "url": "https://new-hope-a1a0b.web.app/meals/fZllELy9hfhmjlU3UKUb?meal=%E1%80%80%E1%80%97%E1%80%BB%E1%80%AC%E1%80%9C%E1%80%BD%E1%80%90%E1%80%BA%E1%80%80%E1%80%AF%E1%80%94%E1%80%BA%E1%80%B8%E1%80%98%E1%80%B1%E1%80%AC%E1%80%84%E1%80%BA%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA",
                "title": "ဝယ်မယ်",
                "webview_height_ratio": "full",
                "messenger_extensions": true,
              }
            ]
          },
          {
            "title": "လျှာဒလက်လည်ငါးပိထောင်း",
            "image_url": "https://firebasestorage.googleapis.com/v0/b/new-hope-a1a0b.appspot.com/o/%E1%80%84%E1%80%AB%E1%80%B8%2F%E1%80%9C%E1%80%BB%E1%80%BE%E1%80%AC%E1%80%92%E1%80%9C%E1%80%80%E1%80%BA%E1%80%9C%E1%80%8A%E1%80%BA%E1%80%84%E1%80%AB%E1%80%B8%E1%80%95%E1%80%AD%E1%80%91%E1%80%B1%E1%80%AC%E1%80%84%E1%80%BA%E1%80%B8_1588504037617?alt=media&token=442cc29c-1b1d-43c6-9f47-d41cc03f1a1b",
            "subtitle": "ငါးပိထောင်းက နူးညံ့အိစက်နေတဲ့အတွက်သရက်သီးစိမ်းလေးနဲ့တို့မလား၊ သခွားသီးလေးနဲ့ကော်ပြီးတို့မလား၊ ထမင်းနဲ့ ဇွိကနဲနယ်စားမလား၊ စားချင်ရာနဲ့သာစားပါ။",
            "buttons": [{
                "type": "postback",
                "title": "ပါဝင်ပစ္စည်းများ",
                "payload": "fish-two-ingre"
              },
              {
                "type": "postback",
                "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
                "payload": "fish-two-how-to"
              },
              {
                "type": "web_url",
                "url": "https://new-hope-a1a0b.web.app/meals/yZx3jlOyLF7u9BGFsDqK?meal=%E1%80%9C%E1%80%BB%E1%80%BE%E1%80%AC%E1%80%92%E1%80%9C%E1%80%80%E1%80%BA%E1%80%9C%E1%80%8A%E1%80%BA%E1%80%84%E1%80%AB%E1%80%B8%E1%80%95%E1%80%AD%E1%80%91%E1%80%B1%E1%80%AC%E1%80%84%E1%80%BA%E1%80%B8",
                "title": "ဝယ်မယ်",
                "webview_height_ratio": "full",
                "messenger_extensions": true,
              }
            ]
          },
          {
            "title": "ကင်းမွန်အချိုချက်",
            "image_url": "https://firebasestorage.googleapis.com/v0/b/new-hope-a1a0b.appspot.com/o/%E1%80%95%E1%80%84%E1%80%BA%E1%80%9C%E1%80%9A%E1%80%BA%E1%80%85%E1%80%AC%2F%E1%80%80%E1%80%84%E1%80%BA%E1%80%B8%E1%80%99%E1%80%BD%E1%80%94%E1%80%BA%E1%80%A1%E1%80%81%E1%80%BB%E1%80%AD%E1%80%AF%E1%80%81%E1%80%BB%E1%80%80%E1%80%BA.jpeg?alt=media&token=b0863152-24a5-4df6-876a-284bb75b2289",
            "subtitle": "ဒီတစ်ခါ နွေရာသီပူပူမှာခံတွင်းလိုက်စေမယ့်ဟင်းလေးတစ်မယ်ဖော်ပြပေးလိုက်ပါတယ်။",
            "buttons": [{
                "type": "postback",
                "title": "ပါဝင်ပစ္စည်းများ",
                "payload": "sf-one-ingre"
              },
              {
                "type": "postback",
                "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
                "payload": "sf-one-how-to"
              },
              {
                "type": "web_url",
                "url": "https://new-hope-a1a0b.web.app/meals/8U5AFaFTILZe5S5wv8HN?meal=%E1%80%80%E1%80%84%E1%80%BA%E1%80%B8%E1%80%99%E1%80%BD%E1%80%94%E1%80%BA%E1%80%A1%E1%80%81%E1%80%BB%E1%80%AD%E1%80%AF%E1%80%81%E1%80%BB%E1%80%80%E1%80%BA",
                "title": "ဝယ်မယ်",
                "webview_height_ratio": "full",
                "messenger_extensions": true,
              }
            ]
          },
          {
            "title": "ကြက်သားပင်စိမ်းအစပ်ကြော်",
            "image_url": "https://firebasestorage.googleapis.com/v0/b/new-hope-a1a0b.appspot.com/o/%E1%80%80%E1%80%BC%E1%80%80%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%2F%E1%80%80%E1%80%BC%E1%80%80%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%E1%80%95%E1%80%84%E1%80%BA%E1%80%85%E1%80%AD%E1%80%99%E1%80%BA%E1%80%B8%E1%80%A1%E1%80%85%E1%80%95%E1%80%BA%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA.jpeg?alt=media&token=34e0760e-07ab-495b-98ba-185667a906aa",
            "subtitle": "ဆောင်းရာသီနဲ့လိုက်ဖက်တဲ့ဟင်းလေးတစ်ခွက်ချက်စားကြရအောင်။ ထိုင်းလိုတော့ ဖတ်ကဖောင်ခေါ်ပါတယ်။ မိမိကြိုက်နှစ်သက်ရာအသားများနှင့်ကြော်နိူင်ပါတယ်။",
            "buttons": [{
                "type": "postback",
                "title": "ပါဝင်ပစ္စည်းများ",
                "payload": "ch-three-ingre"
              },
              {
                "type": "postback",
                "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
                "payload": "ch-three-how-to"
              },

              {
                "type": "web_url",
                "url": "https://new-hope-a1a0b.web.app/meals/z0kDctcITKzw6z9vY79C?meal=%E1%80%80%E1%80%BC%E1%80%80%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%E1%80%95%E1%80%84%E1%80%BA%E1%80%85%E1%80%AD%E1%80%99%E1%80%BA%E1%80%B8%E1%80%A1%E1%80%85%E1%80%95%E1%80%BA%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA",
                "title": "ဝယ်မယ်",
                "webview_height_ratio": "full",
                "messenger_extensions": true,
              }
            ]
          }
        ]
      }
    }
  }
  let response2 = {
    "text": "Main Menu သို့ပြန်သွားလိုပါသလားခင်ဗျာ။",
    "quick_replies": [{
      "content_type": "text",
      "title": "အစသို့ပြန်သွားရန်",
      "image_url": "https://i.imgur.com/YT1qtmF.png",
      "payload": "main-menu"
    }]
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

/* FUNCTION TO SEARCH BY CATEGORY */
const searchByCategory = (sender_psid) => {
  let response;
  response = {
    "text": "Categories တခုချင်းစီကို နှိပ်ပြီး ရှာလို့ရပါတယ်။",
    "quick_replies": [{
        "content_type": "text",
        "title": "ကြက်သား",
        "image_url": "https://i.imgur.com/SJTX4bn.png",
        "payload": "chicken"
      },
      {
        "content_type": "text",
        "title": "ဝက်သား",
        "image_url": "https://i.imgur.com/0Dc8Ds1.png",
        "payload": "pork"
      },
      {
        "content_type": "text",
        "title": "ငါး",
        "image_url": "https://i.imgur.com/GftmobA.png",
        "payload": "fish"
      },
      {
        "content_type": "text",
        "title": "အမဲသား",
        "image_url": "https://i.imgur.com/bNBbE18.png",
        "payload": "beef"
      },
      {
        "content_type": "text",
        "title": "ပင်လယ်စာ",
        "image_url": "https://i.imgur.com/mdTOS7j.png",
        "payload": "sea-food"
      }
    ]
  };
  callSend(sender_psid, response);
}

/* FUNCTION TO CHICKEN */
const chicken = (sender_psid) => {
  let response1 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
            "title": "ကြက်သားချဥ်စော်ခါးသီးသောက်ဆမ်း",
            "image_url": "https://firebasestorage.googleapis.com/v0/b/new-hope-a1a0b.appspot.com/o/%E1%80%80%E1%80%BC%E1%80%80%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%2F%E1%80%80%E1%80%BC%E1%80%80%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%E1%80%81%E1%80%BB%E1%80%A5%E1%80%BA%E1%80%85%E1%80%B1%E1%80%AC%E1%80%BA%E1%80%81%E1%80%AB%E1%80%B8%E1%80%9E%E1%80%AE%E1%80%B8%E1%80%9E%E1%80%B1%E1%80%AC%E1%80%80%E1%80%BA%E1%80%86%E1%80%99%E1%80%BA%E1%80%B8.jpeg?alt=media&token=5a142d5d-aba2-4074-a74d-a30951232e2e",
            "subtitle": "ဒီတစ်ခါ နွေရာသီပူပူမှာခံတွင်းလိုက်စေမယ့်ဟင်းလေးတစ်မယ်ဖော်ပြပေးလိုက်ပါတယ်။",
            "buttons": [{
                "type": "postback",
                "title": "ပါဝင်ပစ္စည်းများ",
                "payload": "ch-one-ingre"
              },
              {
                "type": "postback",
                "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
                "payload": "ch-one-how-to"
              },
              {
                "type": "web_url",
                "url": "https://new-hope-a1a0b.web.app/meals/GQ7axgM5GebOVpP7bGfc?meal=%E1%80%80%E1%80%BC%E1%80%80%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%E1%80%81%E1%80%BB%E1%80%A5%E1%80%BA%E1%80%85%E1%80%B1%E1%80%AC%E1%80%BA%E1%80%81%E1%80%AB%E1%80%B8%E1%80%9E%E1%80%AE%E1%80%B8%E1%80%9E%E1%80%B1%E1%80%AC%E1%80%80%E1%80%BA%E1%80%86%E1%80%99%E1%80%BA%E1%80%B8",
                "title": "ဝယ်မယ်",
                "webview_height_ratio": "full",
                "messenger_extensions": true,
              }
            ]
          },
          {
            "title": "ကြက်ဥကြော်နှပ်",
            "image_url": "https://firebasestorage.googleapis.com/v0/b/new-hope-a1a0b.appspot.com/o/%E1%80%80%E1%80%BC%E1%80%80%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%2F%E1%80%80%E1%80%BC%E1%80%80%E1%80%BA%E1%80%A5%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA%E1%80%94%E1%80%BE%E1%80%95%E1%80%BA_1588502464494?alt=media&token=6bec9703-435b-478f-9f58-8dfc306be98e",
            "subtitle": "ဘယ်သူမဆိုဒီလိုပူအိုက်တဲ့ရာသီမှာအနှစ်ပါတဲ့ဟင်းတွေ၊ဆီပါတဲ့ဟင်းတွေကိုစားချင်ကြမှာမဟုတ်ဘူး။ဒီဟင်းပွဲလေးကတော့ ထမင်းဖြူလေးနဲ့နယ်ဖတ်စားရင်တောင်အရသာရှိမှာအမှန်ပါပဲ။",
            "buttons": [{
                "type": "postback",
                "title": "ပါဝင်ပစ္စည်းများ",
                "payload": "ch-two-ingre"
              },
              {
                "type": "postback",
                "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
                "payload": "ch-two-how-to"
              },

              {
                "type": "web_url",
                "url": "https://new-hope-a1a0b.web.app/meals/2L7hx52K7Fd4pTkgfvjC?meal=%E1%80%80%E1%80%BC%E1%80%80%E1%80%BA%E1%80%A5%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA%E1%80%94%E1%80%BE%E1%80%95%E1%80%BA",
                "title": "ဝယ်မယ်",
                "webview_height_ratio": "full",
                "messenger_extensions": true,
              }
            ]
          },
          {
            "title": "ကြက်သားပင်စိမ်းအစပ်ကြော်",
            "image_url": "https://firebasestorage.googleapis.com/v0/b/new-hope-a1a0b.appspot.com/o/%E1%80%80%E1%80%BC%E1%80%80%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%2F%E1%80%80%E1%80%BC%E1%80%80%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%E1%80%95%E1%80%84%E1%80%BA%E1%80%85%E1%80%AD%E1%80%99%E1%80%BA%E1%80%B8%E1%80%A1%E1%80%85%E1%80%95%E1%80%BA%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA.jpeg?alt=media&token=34e0760e-07ab-495b-98ba-185667a906aa",
            "subtitle": "ဆောင်းရာသီနဲ့လိုက်ဖက်တဲ့ဟင်းလေးတစ်ခွက်ချက်စားကြရအောင်။ ထိုင်းလိုတော့ ဖတ်ကဖောင်ခေါ်ပါတယ်။ မိမိကြိုက်နှစ်သက်ရာအသားများနှင့်ကြော်နိူင်ပါတယ်။",
            "buttons": [{
                "type": "postback",
                "title": "ပါဝင်ပစ္စည်းများ",
                "payload": "ch-three-ingre"
              },
              {
                "type": "postback",
                "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
                "payload": "ch-three-how-to"
              },

              {
                "type": "web_url",
                "url": "https://new-hope-a1a0b.web.app/meals/z0kDctcITKzw6z9vY79C?meal=%E1%80%80%E1%80%BC%E1%80%80%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%E1%80%95%E1%80%84%E1%80%BA%E1%80%85%E1%80%AD%E1%80%99%E1%80%BA%E1%80%B8%E1%80%A1%E1%80%85%E1%80%95%E1%80%BA%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA",
                "title": "ဝယ်မယ်",
                "webview_height_ratio": "full",
                "messenger_extensions": true,
              }
            ]
          },
          {
            "title": "ကြက်​သားနှင့်ပိန္နဲသီးဆီပြန်",
            "image_url": "https://firebasestorage.googleapis.com/v0/b/new-hope-a1a0b.appspot.com/o/%E1%80%80%E1%80%BC%E1%80%80%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%2F%E1%80%80%E1%80%BC%E1%80%80%E1%80%BA%E2%80%8B%E1%80%9E%E1%80%AC%E1%80%B8%E1%80%94%E1%80%BE%E1%80%84%E1%80%BA%E1%80%B7%E1%80%95%E1%80%AD%E1%80%94%E1%80%B9%E1%80%94%E1%80%B2%E1%80%9E%E1%80%AE%E1%80%B8%E1%80%86%E1%80%AE%E1%80%95%E1%80%BC%E1%80%94%E1%80%BA_1588687923541?alt=media&token=6812cf7b-1eec-478b-9186-7c79a1284e7d",
            "subtitle": "ဒီတစ်ခါ နွေရာသီပူပူမှာခံတွင်းလိုက်စေမယ့်ဟင်းလေးတစ်မယ်ဖော်ပြပေးလိုက်ပါတယ်။",
            "buttons": [{
                "type": "postback",
                "title": "ပါဝင်ပစ္စည်းများ",
                "payload": "ch-four-ingre"
              },
              {
                "type": "postback",
                "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
                "payload": "ch-four-how-to"
              },

              {
                "type": "web_url",
                "url": "https://new-hope-a1a0b.web.app/meals/S4pnlwEa2oJA99kSitah?meal=%E1%80%80%E1%80%BC%E1%80%80%E1%80%BA%E2%80%8B%E1%80%9E%E1%80%AC%E1%80%B8%E1%80%94%E1%80%BE%E1%80%84%E1%80%BA%E1%80%B7%E1%80%95%E1%80%AD%E1%80%94%E1%80%B9%E1%80%94%E1%80%B2%E1%80%9E%E1%80%AE%E1%80%B8%E1%80%86%E1%80%AE%E1%80%95%E1%80%BC%E1%80%94%E1%80%BA",
                "title": "ဝယ်မယ်",
                "webview_height_ratio": "full",
                "messenger_extensions": true,
              }
            ]
          },
          {
            "title": "ရှမ်းအရည်ဖျော်",
            "image_url": "https://firebasestorage.googleapis.com/v0/b/new-hope-a1a0b.appspot.com/o/%E1%80%80%E1%80%BC%E1%80%80%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%2F%E1%80%9B%E1%80%BE%E1%80%99%E1%80%BA%E1%80%B8%E1%80%A1%E1%80%9B%E1%80%8A%E1%80%BA%E1%80%96%E1%80%BB%E1%80%B1%E1%80%AC%E1%80%BA_1588689784432?alt=media&token=0c999717-a328-4d02-98b9-8ec0ee3b828d",
            "subtitle": "ရေစိမ်ခေါက်ဆွဲ(ဆန်ဖွယ်)သို့မဟုတ် ဆန်စီးနဲ့လုပ်စားနိူင်ပါတယ်။",
            "buttons": [{
                "type": "postback",
                "title": "ပါဝင်ပစ္စည်းများ",
                "payload": "ch-five-ingre"
              },
              {
                "type": "postback",
                "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
                "payload": "ch-five-how-to"
              },

              {
                "type": "web_url",
                "url": "https://new-hope-a1a0b.web.app/meals/SjkczL0pdSpmLz1vYwGo?meal=%E1%80%9B%E1%80%BE%E1%80%99%E1%80%BA%E1%80%B8%E1%80%A1%E1%80%9B%E1%80%8A%E1%80%BA%E1%80%96%E1%80%BB%E1%80%B1%E1%80%AC%E1%80%BA",
                "title": "ဝယ်မယ်",
                "webview_height_ratio": "full",
                "messenger_extensions": true,
              }
            ]
          }
        ]
      }
    }
  }
  let response2 = {
    "text": "Main Menu သို့ပြန်သွားလိုပါသလားခင်ဗျာ။",
    "quick_replies": [{
      "content_type": "text",
      "title": "အစသို့ပြန်သွားရန်",
      "image_url": "https://i.imgur.com/YT1qtmF.png",
      "payload": "main-menu"
    }]
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

/************************
Functions for Chicken one
*************************/
const chOneIngre = (sender_psid) => {
  let response1 = {
    "text": "ဗမာကြက် = ၅ဝ ကျပ်သား\n\nချဉ်စော်ခါးသီ = ၁ ခြမ်း\n\nချင်းကြီးကြီး = ၁တက်\n\nကြက်သွန်ဖြူ = ၅မွှာ\n\nငရုတ်သီးစိမ်း = ၃တောင့်\n\nကြွက်နားရွယ်မှို = အနည်းငယ်\n\nရှမ်းနံနံ+ကြက်သွန်မြိတ် = အနည်းငယ်စီ"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
            "type": "postback",
            "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
            "payload": "ch-one-how-to"
          },
          {
            "type": "web_url",
            "url": "https://new-hope-a1a0b.web.app/meals/GQ7axgM5GebOVpP7bGfc?meal=%E1%80%80%E1%80%BC%E1%80%80%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%E1%80%81%E1%80%BB%E1%80%A5%E1%80%BA%E1%80%85%E1%80%B1%E1%80%AC%E1%80%BA%E1%80%81%E1%80%AB%E1%80%B8%E1%80%9E%E1%80%AE%E1%80%B8%E1%80%9E%E1%80%B1%E1%80%AC%E1%80%80%E1%80%BA%E1%80%86%E1%80%99%E1%80%BA%E1%80%B8",
            "title": "ဝယ်မယ်",
            "webview_height_ratio": "full",
            "messenger_extensions": true,
          }
        ]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

const chOneHowTo = (sender_psid) => {
  let response1 = {
    "text": "၁။ ကြက်သားကိုရေဆေးသန့်စင်ပြီး ဆား၊ ABC ပဲငံပြာရည်အကြည်၊ အရသာမှုန့်အနည်းငယ်ဖြင့်အရသာနှပ်ထားပါ။\n\n၂။ ချဥ်စော်ခါးသီးကို အခွံခွာအစေ့ထုတ်ပြီးလေးစိတ်ခြမ်းကာ ဆားရည်မှာစိမ်ထားပါ။\n\n၃။ ကြွက်နားရွက်မှိုကိုရေစိမ်သန့်စင်ပြီး ခပ်ပါးပါးလှီးဖြတ်ပါ။\n\n၄။ ငရုတ်သီးစိမ်း ၊ ကြက်သွန်ဖြူ ကိုခပ်ကြမ်းကြမ်းဓားပြားရိုက်ထားပါ။\n\n၅။ ရှမ်းနံနံနှင့်ကြက်သွန်မြိတ်ကို လက်တဆစ်ခန့်လှီးဖြတ်ထားပါ။\n\n၆။ အိုးတစ်လုံးမှာအရသာနယ်ထားတဲ့ကဿ်သားတွေထည့်ပြီး ချင်းတစ်ဝက်ကိုဓားပြားရိုက်ထည့်ပါ။ရေမြှုပ်ရုံလေးထည့်ပြီး ပြုတ်ပါ။\n\n၇။ ထွက်လာတဲ့အမြှုပ်နှင့်အညစ်အကြေးတွေကိုစစ်ထုတ်ပါ(ဟင်းရည်ကြည်စေရန်အတွက်)တပွက်ဆူလာလျှင် ရေအနည်းငယ်ထပ်ဖြည့်ပြီး နောက်တစ်ကြိမ်ဆူလျှင်ဖိုခွင်မှခေတ္တချထားပါ။\n\n၈။ ဒယ်အိုးတစ်လုံးမှာ ဆီအနည်းငယ်ကိုအပူပေးပြီးလက်ကျန်ချင်းကိုပါးပါးလှီးဆီသပ်ပါ။ ဓားပြားရိုက်ထားတဲ့ကြက်သွန်ဖြူ ၊ငရုတ်သီးစိမ်းထည့်ပါ။ ချဥ်စော်ခါးသီးနဲ့ကြွက်နားရွက်မှိုတွေထည့်ဆီသပ်ပါ။\n\n၉။ မွှေးလာလျှင် ပြုတ်ထားတဲ့ကြက်သားအိုးထည့်သို့လောင်းထည့်ပြီး မီးရှိန်လျှော့ချကာတပွက်ဆူအနေအထားဖြင့်ချက်ပါ။\n\n၁၀။ လိုအပ်ပါက ABC ပဲငံပြာရည်အကြည်နှင့်အရသာမှုန့်ထပ်မံဖြည့်စွက်ပါ။"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
          "type": "web_url",
          "url": "https://new-hope-a1a0b.web.app/meals/GQ7axgM5GebOVpP7bGfc?meal=%E1%80%80%E1%80%BC%E1%80%80%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%E1%80%81%E1%80%BB%E1%80%A5%E1%80%BA%E1%80%85%E1%80%B1%E1%80%AC%E1%80%BA%E1%80%81%E1%80%AB%E1%80%B8%E1%80%9E%E1%80%AE%E1%80%B8%E1%80%9E%E1%80%B1%E1%80%AC%E1%80%80%E1%80%BA%E1%80%86%E1%80%99%E1%80%BA%E1%80%B8",
          "title": "ဝယ်မယ်",
          "webview_height_ratio": "full",
          "messenger_extensions": true,
        }]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

/************************
Functions for Chicken two
*************************/
const chTwoIngre = (sender_psid) => {
  let response1 = {
    "text": "ကြက်ဥ = ၃လုံး\n\nကြက်သွန်နီ = ၂လုံး\n\nကြက်သွန်ဖြူ = ၅တက်\n\nငရုတ်သီးကြမ်းဖတ် = ၂ဇွန်း\n\nငါးငံပြာရည် = ၁ဇွန်း\n\nအရသာမှုန့် = ၁ဇွန်း"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
            "type": "postback",
            "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
            "payload": "ch-two-how-to"
          },
          {
            "type": "web_url",
            "url": "https://new-hope-a1a0b.web.app/meals/2L7hx52K7Fd4pTkgfvjC?meal=%E1%80%80%E1%80%BC%E1%80%80%E1%80%BA%E1%80%A5%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA%E1%80%94%E1%80%BE%E1%80%95%E1%80%BA",
            "title": "ဝယ်မယ်",
            "webview_height_ratio": "full",
            "messenger_extensions": true,
          }
        ]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

const chTwoHowTo = (sender_psid) => {
  let response1 = {
    "text": "၁။ ကြက်ဥကို ကျက်အောင်ပြုတ်ပြီး ရေအေးစိမ်၊ အခွံခွာကာထက်ခြမ်း ခြမ်းပါ။\n\n၂။ ကြက်သွန်နီ ၊ ကြက်သွန်ဖြူ တို့ကိုပါးပါးလှီးပါ။\n\n၃။ ဒယ်အိုးတစ်လုံးမှာဆီကိုအပူပေးပြီးခြမ်းထားတဲ့ကြက်ဥကိုရွှေရောင်လေးရအောင်ကြော်ပါ။\n\n၄။ မျက်နှာပြင်လှဖို့အတွက်ဇွန်းလေးနဲ့ဆီပူကိုကော်ပြီးပက်ပေးပါ။ မှောက်ကြော်လိုက်တဲ့အခါအနှစ်တွေထွက်သွားတတ်ပါသည်။\n\n၅။ လက်ကျန်ဆီထဲသို့ကြက်သွန်နီကိုဦးစွာကြော်ပါ။ နနွင်းမှုန့်လေးဇွန်းဖျားခန့်ထည့်ပါ။\n\n၆။ ကြက်သွန်နီတစ်ဝက်ကျက်လောက်ပြီဆိုမှကြက်သွန်ဖြူထည့်ပါ။\n\n၇။ အနည်းငယ်ကြွပ်လာပြီဆိုမှ ငရုတ်သီးခွဲ ကြမ်းဖတ်တွေထည့်ပါ။\n\n၈။ ငါးငံပြာရည် ၊ အရသာမှုန့်တို့ဖြင့်ဖြည့်စွက်ပါ။\n\n၉။ ၎င်းကြက်သွန်နှင့်ငရုတ်သီးအရောကြော်လေးကိုဇွန်းနှင့်ခပ်ပြီးကြော်ယူဆီစစ်ထားတဲ့ကြက်ဥကြော်ပေါ်ကို လောင်းချပေးပါ။"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
          "type": "web_url",
          "url": "https://new-hope-a1a0b.web.app/meals/2L7hx52K7Fd4pTkgfvjC?meal=%E1%80%80%E1%80%BC%E1%80%80%E1%80%BA%E1%80%A5%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA%E1%80%94%E1%80%BE%E1%80%95%E1%80%BA",
          "title": "ဝယ်မယ်",
          "webview_height_ratio": "full",
          "messenger_extensions": true,
        }]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

/**************************
Functions for Chicken three
***************************/
const chThreeIngre = (sender_psid) => {
  let response1 = {
    "text": "အရိုးထုတ်ပြီးကြက်ရင်ပုံသား  = ၁ခြမ်း\n\nငရုတ်သီးစိမ်းနီ = ၁၀တောင့်\n\nကြက်သွန်ဖြူ = ၇တက်\n\nကြက်သွန်နီ = ၁ခြမ်း\n\nပဲတောင့်ရှည် = ၁စည်း\n\nကဖောင်ပင်စိမ်း = ၅ခက်\n\nABC ပဲငံပြာရည်အပျစ် = ၁ဇွန်း\n\nငါးငံပြာရည် = ၁ဇွန်း\n\nသကြား၊ အရသာမှုန့် = ၁ဇွန်း"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
            "type": "postback",
            "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
            "payload": "ch-three-how-to"
          },
          {
            "type": "web_url",
            "url": "https://new-hope-a1a0b.web.app/meals/z0kDctcITKzw6z9vY79C?meal=%E1%80%80%E1%80%BC%E1%80%80%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%E1%80%95%E1%80%84%E1%80%BA%E1%80%85%E1%80%AD%E1%80%99%E1%80%BA%E1%80%B8%E1%80%A1%E1%80%85%E1%80%95%E1%80%BA%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA",
            "title": "ဝယ်မယ်",
            "webview_height_ratio": "full",
            "messenger_extensions": true,
          }
        ]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

const chThreeHowTo = (sender_psid) => {
  let response1 = {
    "text": "၁။ ကြက်သားကို ခပ်​ကြမ်းကြမ်းလေးနုတ်နုတ်စဥ်းကာအရသာနယ်နှပ်ထားပါ။\n\n၂။ ကြက်သွန်ဖြူ ၊ ငရုတ်သီးစိမ်းတောင့်နီကိုရောပြီး ခပ်ကြမ်းကြမ်းလေးထောင်းပါ။\n\n၃။ ပင်စိမ်းရွက်လေးတွေကိုအရွက်ခြွေထားပါ။\n\n၄။ ဒယ်အိုးမှာ ဆီအနည်းငယ်ကိုအပူပေးပြီးကြက်သွန်နီကိုဆီသပ်ပါ။\n\n၅။ နွမ်းပြီးမွှေးလာလျှင်ရောထောင်းထားတဲ့ကြက်သွန်ဖြူ ၊ ငရုတ်သီးအရောကိုဆီသပ်ပါ။\n\n၆။ မွှေးပြီး မွှန်လာလျှင်အရသာနယ်ထားတဲ့ကြက်သားတွေထည့်ပါ။\n\n၇။ ငါးငံပြာရည် ၊ ခရုဆီ ၊ABC ပဲငံပြာရည် အပျစ်၊ သကြား၊ အရသာမှုန့် တို့ဖြင့်အရသာဖြည့်ပါ။\n\n၈။ စိမ့်ထွက်ခါတဲ့အရည်တွေကုန်လာပြီဆို ဆီပြန်လာပါလိမ့်မယ်(အထက်ပါအဆင့်မှာမီးရှိန်ပြင်းဖို့လိုပါမယ်)\n\n၉။ ဆီပြန်လာပြီဆို ခပ်စောင်းလှီးထားတဲ့ပဲတောင့်ရှည်ပင်စိမ်းရွက်အုပ် ၊ ငရုတ်ကောင်းလေးဖြူးပြီး တည်ခင်းမယ့်ပန်းကန်ထဲပြောင်းထည့်ပါ။\n\n၁၀။ ချို ၊စပ် မွှေးပြီးအရသာရှိတဲ့ကြက်သားပင်စိမ်းကြော်လေးရပါပြီ။"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
          "type": "web_url",
          "url": "https://new-hope-a1a0b.web.app/meals/z0kDctcITKzw6z9vY79C?meal=%E1%80%80%E1%80%BC%E1%80%80%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%E1%80%95%E1%80%84%E1%80%BA%E1%80%85%E1%80%AD%E1%80%99%E1%80%BA%E1%80%B8%E1%80%A1%E1%80%85%E1%80%95%E1%80%BA%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA",
          "title": "ဝယ်မယ်",
          "webview_height_ratio": "full",
          "messenger_extensions": true,
        }]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

/**************************
Functions for Chicken four
***************************/
const chFourIngre = (sender_psid) => {
  let response1 = {
    "text": "ကြက်သား = တစ်ခြမ်း(၃၀ကျပ်သား)\n\nပိန္နဲ သီးစိမ်းနုနု = ၃၀ကျပ်သား\n\nကြက်​သွန်​နီ = ၂လုံး\n\nကြက်​သွန်​ဖြူ = ၃တက်​\n\nချင်းကြီးကြီး = ၁တက်​"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
            "type": "postback",
            "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
            "payload": "ch-four-how-to"
          },
          {
            "type": "web_url",
            "url": "https://new-hope-a1a0b.web.app/meals/S4pnlwEa2oJA99kSitah?meal=%E1%80%80%E1%80%BC%E1%80%80%E1%80%BA%E2%80%8B%E1%80%9E%E1%80%AC%E1%80%B8%E1%80%94%E1%80%BE%E1%80%84%E1%80%BA%E1%80%B7%E1%80%95%E1%80%AD%E1%80%94%E1%80%B9%E1%80%94%E1%80%B2%E1%80%9E%E1%80%AE%E1%80%B8%E1%80%86%E1%80%AE%E1%80%95%E1%80%BC%E1%80%94%E1%80%BA",
            "title": "ဝယ်မယ်",
            "webview_height_ratio": "full",
            "messenger_extensions": true,
          }
        ]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

const chFourHowTo = (sender_psid) => {
  let response1 = {
    "text": "၁။ ကြက်သားတွေကိုရေ​ဆေးသန့်​စင်​ပြီးအ​နေ​တော်​အတုံး​လေးများတုံးပါ။\n\n၂။ ချင်းနှင့်​ကြက်​သွန်​ဖြူ ကိုညှက်​နေ​အောင်​ရော​ထောင်းပါ။ကြက်​သွန်​နီကို​တော့နုပ်​နုပ်​စဉ်းပြီးလှီးပါ။\n\n၃။ တုံးထားတဲ့ကြက်​သားထဲကိုချင်း+ကြက်​သွန်​ဖြူ​ထောင်းအရည်​ကိုညှစ်​ချပြီး ဆား၊ဟင်းခတ်​မှုန့်​၊ကြက်​သားမှုန့်​၊ နနွင်းမှုန့်​နှင့်​အ​ရောင်​တင်​မှုန့်​အနည်းငယ်​စီထည့်​နယ်​ကာနှပ်​ထားပါ။\n\n၄။ ပိန္နဲသီးအစိမ်းနုနုကိုအခွံခွာပြီးအတုံးငယ်များတုံးကာ ဆားပါသောရေအေးမှာစိမ်ထားပါ။\n\n၅။ အရသာနှပ်​ထားချိန်​(၁၅)မိနစ်​လောက်​ရှိပြီဆိုဒယ်​အိုးတစ်​လုံးမှာဆီအနည်းငယ်​ကိုအပူ​ပေးပြီးကြက်သွန်နီတွေကိုထည့်ကြော်ပါ။\n\n၆။ ကြက်​သွန်​နီ​တွေ​ရွှေ​ရောင်​သန်းလာပြီဆိုရင်​အရသာနှပ်​ထားတဲ့ကြက်​သားတွေထည့်​ပါ။\n\n၇။ ရေစိမ်ထားတဲ့ပိန္နဲသီးအစိမ်းနုနုတွေထည့်ပါ။သမသွား​အောင်​ဖြေးညင်းစွာ​မွှေ​ပေးပြီးအဖုံးအုပ်​ထားပါ။\n\n၈။ မီးရှိန်လျှော့ချပြီး မကြေမွှစေရန် နှပ်ချက်ချက်နည်းကိုအသုံးပြုပါ။\n\n၉။ အနှစ်​ကျပြီးဆီပြန်​လာလျှင်​အဖုံးဖွင့်​ပြီး​မွှေ​ပေးပါ။\n\n၁၀။ ရေအနည်းငယ်ဖြည့်စွက်ပြီး ဆီပြန်လာလျှင်ဖိုပေါ်မှချပါ။\n\nမှတ်ချက် ။ ဝက်သားသုံးထပ်သားနှင့်နှပ်ရင်ပိုကောင်းပေမယ့် လူအများအားလုံးစားနိူင်ဖို့ ကြက်သားကိုရွေးချယ်ထားပါတယ်။"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
          "type": "web_url",
          "url": "https://new-hope-a1a0b.web.app/meals/S4pnlwEa2oJA99kSitah?meal=%E1%80%80%E1%80%BC%E1%80%80%E1%80%BA%E2%80%8B%E1%80%9E%E1%80%AC%E1%80%B8%E1%80%94%E1%80%BE%E1%80%84%E1%80%BA%E1%80%B7%E1%80%95%E1%80%AD%E1%80%94%E1%80%B9%E1%80%94%E1%80%B2%E1%80%9E%E1%80%AE%E1%80%B8%E1%80%86%E1%80%AE%E1%80%95%E1%80%BC%E1%80%94%E1%80%BA",
          "title": "ဝယ်မယ်",
          "webview_height_ratio": "full",
          "messenger_extensions": true,
        }]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

/**************************
Functions for Chicken five
***************************/
const chFiveIngre = (sender_psid) => {
  let response1 = {
    "text": "ရှမ်းခေါက်ဆွဲ = ၁ပိဿာ\n\nကြက်ရိုး = ၅၀ကျပ်သား\n\nကြက်ရင်ပုံသား = ၂၅ကျပ်သား\n\nကြက်သွန်နီ = ၃လုံး\n\nကြက်သွန်ဖြူ = ၁၀ မွှာခန့်\n\nချင်းကြီးကြီး = ၁တက်\n\nကြက်သွန်မြိတ်+နံနံပင်\n\nABC ပဲငံပြာရည်အပျစ်\n\nABCcပဲငံပြာရည်အကျဲ"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
            "type": "postback",
            "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
            "payload": "ch-five-how-to"
          },
          {
            "type": "web_url",
            "url": "https://new-hope-a1a0b.web.app/meals/SjkczL0pdSpmLz1vYwGo?meal=%E1%80%9B%E1%80%BE%E1%80%99%E1%80%BA%E1%80%B8%E1%80%A1%E1%80%9B%E1%80%8A%E1%80%BA%E1%80%96%E1%80%BB%E1%80%B1%E1%80%AC%E1%80%BA",
            "title": "ဝယ်မယ်",
            "webview_height_ratio": "full",
            "messenger_extensions": true,
          }
        ]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

const chFiveHowTo = (sender_psid) => {
  let response1 = {
    "text": "၁။ ပထမဆုံးကြက်ရိုးတွေကိုချင်းတက်ရဲ့တဝက်လောက်ဓားပြားရိုက်ပြီးဟင်းရည်ကြည်ရအောင်ပြုတ်ပါ။\n\n၂။ ကြက်ရင်ပုံသားကိုအတုံးငယ်လေးတွေတုံးပြီးချင်းအရည်ညှစ်ထည့်ကာအရသာနယ်ပါ။\n\n၃။ ကြက်သွန်နီကိုငရုတ်စိမ်းမှုန့်နှင့်ဆီသပ်ပြီး မွှေးလာလျှင်ကြက်သားတုံးလေးတွေထည့်ပါ။သကြား၊အရသာမှုန့်၊ ABCပဲငံပြာရည်အပျစ်၊ အကျဲတို့ဖြင့်အရသာဖြည့်စွက်ပါ။\n\n၄။ ကြက်သွန်ဖြူကိုအရောင်မပါပဲ ဆီချက် ပြုလုပ်ပါ။\n\n၅။ ငရုတ်သီးလှော်မှုန့်နှင့်နှမ်းကိုရောပြီးဆီသပ်ပါ။(အစပ်နှင့်မွှေးရနံ့အတွက်)\n\n၆။ ထပ်ပြီးမွှေးလိုလျှင်ဝှားကျောင်း(မက်ခါသီး)နှင့်တရုတ်မဆလာအမှုန့်(ရှောက်ကော၊ပါ့ကော)ကိုဆီပူလောင်းပြီးဆီမွှေးပြုလုပ်ထားပါ။\n\n၇။ ခေါက်ဆွဲပြင်တော့မယ်ဆိုရင် အရွက်စိမ်းတစ်မျိုးမျိုး(ပဲရွက်၊မုန်ညှင်းစိမ်း)နှင့်တစ်ပွဲစာခေါက်ဆွဲကိုရေနွေးဆူဆူမှာဇကာလေးခံပြီးပြုတ်ပါ။\n\n၈။ ပန်းကန်လုံးတစ်ခုထဲမှာခေါက်ဆွဲကိုထည့်ပြီးအရသာမှုန့်၊သကြား၊ ABC ပဲငံပြာရည်အကျဲဖြင့်အရသာထည့်ဖြည့်ပါ။\n\n၉။ ကြက်သားဟင်းအနှစ် ၁ဇွန်း၊ ကြက်သွန်ဖြူဆီချက်၊ ငရုတ်ကောင်းမှုန့်၊ကြက်သွန်မြိတ်၊နံနံပင်ထည့်ကာ ကြက်ပြုတ်ရည်ပူပူလေးလောင်းထည့်ပါ။\n\nငရုတ်သီး+နှမ်းဆီချက် ၊ ရှမ်းချဥ်(မုန်ညှင်းချဥ်)၊ ဂေါ်ဖီချဥ်တို့ဖြင့်တွဲဖက်သုံးဆောင်ပါ။"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
          "type": "web_url",
          "url": "https://new-hope-a1a0b.web.app/meals/SjkczL0pdSpmLz1vYwGo?meal=%E1%80%9B%E1%80%BE%E1%80%99%E1%80%BA%E1%80%B8%E1%80%A1%E1%80%9B%E1%80%8A%E1%80%BA%E1%80%96%E1%80%BB%E1%80%B1%E1%80%AC%E1%80%BA",
          "title": "ဝယ်မယ်",
          "webview_height_ratio": "full",
          "messenger_extensions": true,
        }]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

/* FUNCTION TO PORK */
const pork = (sender_psid) => {
  let response1 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
            "title": "သုံးထပ်သားအချိုချက်",
            "image_url": "https://firebasestorage.googleapis.com/v0/b/new-hope-a1a0b.appspot.com/o/%E1%80%9D%E1%80%80%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%2F%E1%80%9E%E1%80%AF%E1%80%B6%E1%80%B8%E1%80%91%E1%80%95%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%E1%80%A1%E1%80%81%E1%80%BB%E1%80%AD%E1%80%AF%E1%80%81%E1%80%BB%E1%80%80%E1%80%BA.jpeg?alt=media&token=8f228c0d-4399-43ef-89a6-3e1afa3f6ec9",
            "subtitle": "ဒီတစ်ခါ နွေရာသီပူပူမှာခံတွင်းလိုက်စေမယ့်ဟင်းလေးတစ်မယ်ဖော်ပြပေးလိုက်ပါတယ်။",
            "buttons": [{
                "type": "postback",
                "title": "ပါဝင်ပစ္စည်းများ",
                "payload": "pork-one-ingre"
              },
              {
                "type": "postback",
                "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
                "payload": "pork-one-how-to"
              },
              {
                "type": "web_url",
                "url": "https://new-hope-a1a0b.web.app/meals/7mJbQUg5bdQbZCtylXXK?meal=%E1%80%9E%E1%80%AF%E1%80%B6%E1%80%B8%E1%80%91%E1%80%95%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%E1%80%A1%E1%80%81%E1%80%BB%E1%80%AD%E1%80%AF%E1%80%81%E1%80%BB%E1%80%80%E1%80%BA",
                "title": "ဝယ်မယ်",
                "webview_height_ratio": "full",
                "messenger_extensions": true,
              }
            ]
          },
          {
            "title": "ကဗျာလွတ်ကုန်းဘောင်ကြော်",
            "image_url": "https://firebasestorage.googleapis.com/v0/b/new-hope-a1a0b.appspot.com/o/%E1%80%9D%E1%80%80%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%2F%E1%80%80%E1%80%97%E1%80%BB%E1%80%AC%E1%80%9C%E1%80%BD%E1%80%90%E1%80%BA%E1%80%80%E1%80%AF%E1%80%94%E1%80%BA%E1%80%B8%E1%80%98%E1%80%B1%E1%80%AC%E1%80%84%E1%80%BA%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA.jpeg?alt=media&token=d3d25a4b-8ba1-42bb-88b7-27fa293cc474",
            "subtitle": "ဒီဟင်းပွဲအတွက်မည်သည့်အသားကိုမဆိုအသုံးပြုနိူင်ပါတယ်။ ကြက်၊ ဝက်၊ အမဲ၊ဆိတ်။ ကျွန်တော်က ဝက်လိုင်းသားလေးအသုံးပြုထားပါတယ်။",
            "buttons": [{
                "type": "postback",
                "title": "ပါဝင်ပစ္စည်းများ",
                "payload": "pork-two-ingre"
              }, {
                "type": "postback",
                "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
                "payload": "pork-two-how-to"
              },
              {
                "type": "web_url",
                "url": "https://new-hope-a1a0b.web.app/meals/fZllELy9hfhmjlU3UKUb?meal=%E1%80%80%E1%80%97%E1%80%BB%E1%80%AC%E1%80%9C%E1%80%BD%E1%80%90%E1%80%BA%E1%80%80%E1%80%AF%E1%80%94%E1%80%BA%E1%80%B8%E1%80%98%E1%80%B1%E1%80%AC%E1%80%84%E1%80%BA%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA",
                "title": "ဝယ်မယ်",
                "webview_height_ratio": "full",
                "messenger_extensions": true,
              }
            ]
          },
          {
            "title": "ဝက်သားချဥ်စပ်",
            "image_url": "https://firebasestorage.googleapis.com/v0/b/new-hope-a1a0b.appspot.com/o/%E1%80%9D%E1%80%80%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%2F%E1%80%9D%E1%80%80%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%E1%80%81%E1%80%BB%E1%80%A5%E1%80%BA%E1%80%85%E1%80%95%E1%80%BA.jpg?alt=media&token=96a3d851-10b6-4d90-bc77-6a49d8e872f7",
            "subtitle": "ဝက်သား၊ ကြက်သား မိမိနှစ်သက်ရာအသားကိုအသုံးပြုနိူင်ပါတယ်။",
            "buttons": [{
                "type": "postback",
                "title": "ပါဝင်ပစ္စည်းများ",
                "payload": "pork-three-ingre"
              }, {
                "type": "postback",
                "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
                "payload": "pork-three-how-to"
              },
              {
                "type": "web_url",
                "url": "https://new-hope-a1a0b.web.app/meals/uATPkaKbWia2XDiAlhWO?meal=%E1%80%9D%E1%80%80%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%E1%80%81%E1%80%BB%E1%80%A5%E1%80%BA%E1%80%85%E1%80%95%E1%80%BA",
                "title": "ဝယ်မယ်",
                "webview_height_ratio": "full",
                "messenger_extensions": true,
              }
            ]
          },
          {
            "title": "သုံးထပ်သားနှင့်ဘဲဥအချိုချက်",
            "image_url": "https://firebasestorage.googleapis.com/v0/b/new-hope-a1a0b.appspot.com/o/%E1%80%9D%E1%80%80%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%2F%E1%80%9E%E1%80%AF%E1%80%B6%E1%80%B8%E1%80%91%E1%80%95%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%E1%80%94%E1%80%BE%E1%80%84%E1%80%BA%E1%80%B7%E1%80%98%E1%80%B2%E1%80%A5%E1%80%A1%E1%80%81%E1%80%BB%E1%80%AD%E1%80%AF%E1%80%81%E1%80%BB%E1%80%80%E1%80%BA_1588691174632?alt=media&token=cc22b6bd-5222-4341-a7e4-f57f0ff3cedf",
            "subtitle": "ဒီတစ်ခါ နွေရာသီပူပူမှာခံတွင်းလိုက်စေမယ့်ဟင်းလေးတစ်မယ်ဖော်ပြပေးလိုက်ပါတယ်။",
            "buttons": [{
                "type": "postback",
                "title": "ပါဝင်ပစ္စည်းများ",
                "payload": "pork-four-ingre"
              }, {
                "type": "postback",
                "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
                "payload": "pork-four-how-to"
              },
              {
                "type": "web_url",
                "url": "https://new-hope-a1a0b.web.app/meals/ERWds6E6HhPBgzkwIKJV?meal=%E1%80%9E%E1%80%AF%E1%80%B6%E1%80%B8%E1%80%91%E1%80%95%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%E1%80%94%E1%80%BE%E1%80%84%E1%80%BA%E1%80%B7%E1%80%98%E1%80%B2%E1%80%A5%E1%80%A1%E1%80%81%E1%80%BB%E1%80%AD%E1%80%AF%E1%80%81%E1%80%BB%E1%80%80%E1%80%BA",
                "title": "ဝယ်မယ်",
                "webview_height_ratio": "full",
                "messenger_extensions": true,
              }
            ]
          },
          {
            "title": "ဝက်နံရိုးနုကြော်",
            "image_url": "https://firebasestorage.googleapis.com/v0/b/new-hope-a1a0b.appspot.com/o/%E1%80%9D%E1%80%80%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%2F%E1%80%9D%E1%80%80%E1%80%BA%E1%80%94%E1%80%B6%E1%80%9B%E1%80%AD%E1%80%AF%E1%80%B8%E1%80%94%E1%80%AF%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA_1588690461101?alt=media&token=663af3c1-bc78-4a16-807b-e76af0c316d2",
            "subtitle": "ဒီတစ်ခါလွယ်ကူရိုးရှင်းပြီးအမြန်ချက်လို့ရတဲ့ဟင်းချက်နည်းလေးတစ်ခုဝေမျှပါ့မယ်။",
            "buttons": [{
                "type": "postback",
                "title": "ပါဝင်ပစ္စည်းများ",
                "payload": "pork-five-ingre"
              }, {
                "type": "postback",
                "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
                "payload": "pork-five-how-to"
              },
              {
                "type": "web_url",
                "url": "https://new-hope-a1a0b.web.app/meals/8ONOD4Bz5nA2TKWWiLC7?meal=%E1%80%9D%E1%80%80%E1%80%BA%E1%80%94%E1%80%B6%E1%80%9B%E1%80%AD%E1%80%AF%E1%80%B8%E1%80%94%E1%80%AF%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA",
                "title": "ဝယ်မယ်",
                "webview_height_ratio": "full",
                "messenger_extensions": true,
              }
            ]
          },
        ]
      }
    }
  }
  let response2 = {
    "text": "Main Menu သို့ပြန်သွားလိုပါသလားခင်ဗျာ။",
    "quick_replies": [{
      "content_type": "text",
      "title": "အစသို့ပြန်သွားရန်",
      "image_url": "https://i.imgur.com/YT1qtmF.png",
      "payload": "main-menu"
    }]
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

/*********************
Functions for Pork one
**********************/
const porkOneIngre = (sender_psid) => {
  let response1 = {
    "text": "သုံးထပ်သား = ၃၀ကျပ်သား\n\nချင်း = ၂တက်\n\nကြက်သွန်နီဥကြီး = ၁လုံး\n\nကြက်သွန်နီဥသေး = ၁၀လုံး\n\nကြက်သွန်ဖြူ = ၅တက်\n\nနာနတ်ပွင့် = ၂ပွင့်\n\nဟင်းချက်ဝိုင် = ၂ဇွန်း\n\nသကြား = ၁ ဇွန်း\n\nABCပဲငံပြာရည်အကျဲ = ၂ဇွန်း\n\nABCပဲငံပြာရည်အပျစ် = ၁ဇွန်း"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
            "type": "postback",
            "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
            "payload": "pork-one-how-to"
          },
          {
            "type": "web_url",
            "url": "https://new-hope-a1a0b.web.app/meals/7mJbQUg5bdQbZCtylXXK?meal=%E1%80%9E%E1%80%AF%E1%80%B6%E1%80%B8%E1%80%91%E1%80%95%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%E1%80%A1%E1%80%81%E1%80%BB%E1%80%AD%E1%80%AF%E1%80%81%E1%80%BB%E1%80%80%E1%80%BA",
            "title": "ဝယ်မယ်",
            "webview_height_ratio": "full",
            "messenger_extensions": true,
          }
        ]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

const porkOneHowTo = (sender_psid) => {
  let response1 = {
    "text": "၁။ သုံးထပ်သားတွေကိုမိမိနှစ်သက်တဲ့အရွယ်တုံးပြီးရေစစ်ထားပါ။\n\n၂။ နာနတ်ပွင့် ကိုမီးကင်ပြီးဓားပြားရိုက်ထားပါ။\n\n၃။ ချင်းနှင့်ကြက်သွန်ဖြူ ကိုညှက်နေအောင်ထောင်းပြီးသုံးထပ်သားထဲညှစ်ထည့်ပြီးသကြား၊ABCပဲငံပြာရည်အပျစ်၊ ABCပဲငံပြာရည် အကျဲ၊ဟင်းခတ်မှုန့်၊ဟင်းချက်ဝိုင်တို့နှင့်နယ်ပြီး(၁၅)မိနစ်ခန့်နှပ်ထားပါ။\n\n၄။ အသားနယ်ထားချိန်ပြည့်ပြီဆိုပါကဒယ်အိုးတစ်လုံးမှာဆီအနည်းငယ်ကိုအပူပေးပြီးပါးပါးလှီးထားတဲ့ကြက်သွန်နီဥကြီးကိုဆီသတ်ပါ။\n\n၅။ အနည်းငယ်မွှေးပြီးနွမ်းလာလျှင်နယ်ပြီးနှပ်ထားတဲ့သုံးထပ်သားတွေထည့်မွှေပါ။\n\n၆။ အနှစ်ကျသွားပြီဆိုရင် pressure အိုးထဲပြောင်းထည့်ပြီး (၁၅)မိနစ်ခန့်နှပ်ချက်ချက်ပါ။\n\n၇။ အဖုံးဖွင့်ပြီးကြက်သွန်နီဥသေးလေးတွေကိုအလုံးလိုက်ထည့်ပါ။\n\nနောက်ထပ်(၅)မိနစ်ခန့်နှပ်ပေးပြီးအိုးထဲမှဆယ်ထုတ်ပါ။"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
          "type": "web_url",
          "url": "https://new-hope-a1a0b.web.app/meals/7mJbQUg5bdQbZCtylXXK?meal=%E1%80%9E%E1%80%AF%E1%80%B6%E1%80%B8%E1%80%91%E1%80%95%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%E1%80%A1%E1%80%81%E1%80%BB%E1%80%AD%E1%80%AF%E1%80%81%E1%80%BB%E1%80%80%E1%80%BA",
          "title": "ဝယ်မယ်",
          "webview_height_ratio": "full",
          "messenger_extensions": true,
        }]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

/*********************
Functions for Pork two
**********************/
const porkTwoIngre = (sender_psid) => {
  let response1 = {
    "text": "ဝက်လိုင်းသား = ၂၀ကျပ်သား\n\nကြက်သွန်နီ = ၂လုံး\n\nခရမ်းချဉ်သီး = ၂လုံး\n\nချင်းသေးသေး = ၁တက်\n\nရွှေပဲသီး = ၁၀တောင့်ခန့်\n\nငရုတ်ပွခြောက်ရှည် = ၅တောင့်\n\nကြက်သွန်မြိတ် = ၃ပင်\n\nABC ပဲငံပြာရည်အပျစ်\n\nABC ပဲငံပြာရည်အကျဲ"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
            "type": "postback",
            "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
            "payload": "pork-two-how-to"
          },
          {
            "type": "web_url",
            "url": "https://new-hope-a1a0b.web.app/meals/fZllELy9hfhmjlU3UKUb?meal=%E1%80%80%E1%80%97%E1%80%BB%E1%80%AC%E1%80%9C%E1%80%BD%E1%80%90%E1%80%BA%E1%80%80%E1%80%AF%E1%80%94%E1%80%BA%E1%80%B8%E1%80%98%E1%80%B1%E1%80%AC%E1%80%84%E1%80%BA%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA",
            "title": "ဝယ်မယ်",
            "webview_height_ratio": "full",
            "messenger_extensions": true,
          }
        ]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

const porkTwoHowTo = (sender_psid) => {
  let response1 = {
    "text": "၁။ ပထမဆုံးအသားကိုမိမိစိတ်ကြိုက်အတုံးငယ်(သို့)ခပ်ပါးပါးလှီးကာ အရသာမှုန့်၊ ABC ပဲငံပြာရည်အပျစ်၊ အကျဲတို့ဖြင့်အရသာနယ်ကာ (၅)မိနစ်ခန့်နှပ်ထားပါ။\n\n၂။ ကြက်သွန်နီကိုလေးစိတ်ခွဲပြီးအလွှာလေးတွေခွာထားပါ။ခရမ်းချဥ်သီးကိုလေးစိတ်ခွဲလှီးကာအူတိုင်နှင့်အစေ့တွေထုတ်ပါ။\n\n၃။ ချင်းကိုအမျှင်လှီးပြီး ရွှေပဲသီးကိုထက်ပိုင်းဖြတ်ပါ။ ကြက်သွန်မြိတ်ကိုလက်တဆစ်ခန့်လှီးပါ။\n\n၄။ ဒယ်အိုးတစ်လုံးမှာဆီအနည်းငယ်ကိုအပူပေးပြီး အညှာခြွေထားတဲ့ငရုတ်ပွခြောက်အရှည်ကိုမွှေးပြီးကျွမ်းအောင်ကြော်ကာ ဆီစစ်ထားပါ။\n\n၅။ ကြက်သွန်နီ၊ ရွှေပဲ ၊ ခရမ်းချဥ်သီးတွေကိုလည်းတစ်ခုချင်းစီထည့်ကြော်ပြီးဆီစစ်ထားပါ။\n\n၆။ လက်ကျန်ဆီမှာချင်းကိုဆီသပ်ပြီးမွှေးလာပြီဆိုအရသာနယ်ထားတဲ့အသားတွေထည့်ကြော်ပါ။\n\n၇။ အရသာမှုန့် ၊ခရုဆီ၊ သကြား၊ ABC ပဲငံပြာရည်အပျစ်၊ အကျဲတို့ဖြင့်အရသာဖြည့်စွက်ပါ။\n\n၈။ ကြော်ယူဆီစစ်ထားတဲ့ ကြက်သွန်၊ ခရမ်းချဉ်သီး ၊ ရွှေပဲ ၊ငရုတ်ခြောက်တောင့်ရှည်တွေထည့်ပြီး မွှေပေးပါ။\n\n၉။ နောက်ဆုံးမှာ ကြက်သွန်မြိတ်၊ ငရုတ်ကောင်းလေးဖြူးပေးပါ။\n\nမှတ်ချက်။ ဒီဟင်းပွဲဟာမီးရှိန်ပြင်းပြင်းဖြင့်အမြန်ချက်ပြုတ်ကာပူပူနွေးနွေးသုံးဆောင်ရတဲ့ဟင်းပွဲဖြစ်ပါတယ်။"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
          "type": "web_url",
          "url": "https://new-hope-a1a0b.web.app/meals/fZllELy9hfhmjlU3UKUb?meal=%E1%80%80%E1%80%97%E1%80%BB%E1%80%AC%E1%80%9C%E1%80%BD%E1%80%90%E1%80%BA%E1%80%80%E1%80%AF%E1%80%94%E1%80%BA%E1%80%B8%E1%80%98%E1%80%B1%E1%80%AC%E1%80%84%E1%80%BA%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA",
          "title": "ဝယ်မယ်",
          "webview_height_ratio": "full",
          "messenger_extensions": true,
        }]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

/***********************
Functions for Pork three
************************/
const porkThreeIngre = (sender_psid) => {
  let response1 = {
    "text": "ဝက်လိုင်းသား = ၂၀ကျပ်သား\n\nကြက်သွန်နီ = ၂လုံး\n\nခရမ်းချဉ်သီး = ၂လုံး\n\nချင်းသေးသေး = ၁တက်\n\nငရုတ်သီးခွဲကြမ်း = ၁ဇွန်း\n\nဗီနီဂါ = ၁ဇွန်း\n\nငရုတ်ဆော့စ်အပျစ် = ၂ဇွန်း\n\nသံပုရာသီး = ၁စိတ်\n\nကြက်သွန်မြိတ် = ၃ပင်\n\nABC ပဲငံပြာရည်အပျစ်\n\nABC ပဲငံပြာရည်အကျဲ"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
            "type": "postback",
            "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
            "payload": "pork-three-how-to"
          },
          {
            "type": "web_url",
            "url": "https://new-hope-a1a0b.web.app/meals/uATPkaKbWia2XDiAlhWO?meal=%E1%80%9D%E1%80%80%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%E1%80%81%E1%80%BB%E1%80%A5%E1%80%BA%E1%80%85%E1%80%95%E1%80%BA",
            "title": "ဝယ်မယ်",
            "webview_height_ratio": "full",
            "messenger_extensions": true,
          }
        ]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

const porkThreeHowTo = (sender_psid) => {
  let response1 = {
    "text": "၁။ ပထမဆုံးအသားကိုမိမိစိတ်ကြိုက်အတုံးငယ်(သို့)ခပ်ပါးပါးလှီးကာ အရသာမှုန့်၊ ABC ပဲငံပြာရည်အပျစ်၊ အကျဲတို့ဖြင့်အရသာနယ်ကာ (၅)မိနစ်ခန့်နှပ်ထားပါ။\n\n၂။ ကြက်သွန်နီကိုလေးစိတ်ခွဲပြီးအလွှာလေးတွေခွာထားပါ။ခရမ်းချဥ်သီးကိုလေးစိတ်ခွဲလှီးကာအူတိုင်နှင့်အစေ့တွေထုတ်ပါ။\n\n၃။ ချင်းကိုအမျှင်လှီးပြီး ငရုတ်ခွဲကြမ်းမှုန့် တစ်ဇွန်းပြင်ဆင်ထားပါ။\n\n၄။ ကြက်သွန်မြိတ်ကိုလက်တဆစ်ခန့်လှီးပါ။\n\n၅။ ဒယ်အိုးတစ်လုံးမှာဆီအနည်းငယ်ကိုအပူပေးပြီး ကြက်သွန်နီ၊  ခရမ်းချဥ်သီးတွေကိုတစ်ခုချင်းစီထည့်ကြော်ပြီးဆီစစ်ထားပါ။\n\n၆။ လက်ကျန်ဆီမှာချင်းကိုဆီသပ်ပြီးမွှေးလာပြီဆိုအရသာနယ်ထားတဲ့အသားတွေထည့်ကြော်ပါ။\n\n၇။ ငရုတ်ခွဲကြမ်းမှုန့်၊ ဗီနီဂါ ၊ ငရုတ်ဆော့စ် အရသာမှုန့် ၊ခရုဆီ၊ သကြား၊ ABC ပဲငံပြာရည်အပျစ်၊ အကျဲတို့ဖြင့်အရသာဖြည့်စွက်ပါ။\n\n၈။ ကြော်ယူဆီစစ်ထားတဲ့ ကြက်သွန်နီ၊ ခရမ်းချဉ်သီး ၊ တွေထည့်ပြီး မွှေပေးပါ။\n\n၉။ နောက်ဆုံးမှာ ကြက်သွန်မြိတ်၊ ငရုတ်ကောင်းလေးဖြူးပေးပါ။\n\nမှတ်ချက်။ ဒီဟင်းပွဲဟာမီးရှိန်ပြင်းပြင်းဖြင့်အမြန်ချက်ပြုတ်ကာပူပူနွေးနွေးသုံးဆောင်ရတဲ့ဟင်းပွဲဖြစ်ပါတယ်။"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
          "type": "web_url",
          "url": "https://new-hope-a1a0b.web.app/meals/uATPkaKbWia2XDiAlhWO?meal=%E1%80%9D%E1%80%80%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%E1%80%81%E1%80%BB%E1%80%A5%E1%80%BA%E1%80%85%E1%80%95%E1%80%BA",
          "title": "ဝယ်မယ်",
          "webview_height_ratio": "full",
          "messenger_extensions": true,
        }]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

/***********************
Functions for Pork four
************************/
const porkFourIngre = (sender_psid) => {
  let response1 = {
    "text": "သုံးထပ်သား = ၂၀ကျပ်သား\n\nဘဲဥ = ၃လုံး\n\nပဲပြား = ၂တုံး\n\nမုန်လာဥဖြူသေး = ၂လုံး\n\nငရုတ်ကောင်းစေ့ = ဇွန်းဝက်\n\nကြက်သွန်ဖြူ = ၅မွှာ\n\nချင်းသေးသေး = ၁တက်\n\nနံနံပင်အမြစ် = ၁၀ခု\n\nနာနတ်ပွင့် = ၁ပွင့်\n\nသစ်ကြပိုးခေါက် = ၁ခု\n\nသကြား = ၁ဇွန်း\n\nABC ပဲငံပြာရည်အပျစ် = ၁ဇွန်း\n\nABCပဲငံပြာရည်အကျဲ = ၂ဇွန်း\n\nဆား = အနည်းငယ်"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
            "type": "postback",
            "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
            "payload": "pork-four-how-to"
          },
          {
            "type": "web_url",
            "url": "https://new-hope-a1a0b.web.app/meals/ERWds6E6HhPBgzkwIKJV?meal=%E1%80%9E%E1%80%AF%E1%80%B6%E1%80%B8%E1%80%91%E1%80%95%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%E1%80%94%E1%80%BE%E1%80%84%E1%80%BA%E1%80%B7%E1%80%98%E1%80%B2%E1%80%A5%E1%80%A1%E1%80%81%E1%80%BB%E1%80%AD%E1%80%AF%E1%80%81%E1%80%BB%E1%80%80%E1%80%BA",
            "title": "ဝယ်မယ်",
            "webview_height_ratio": "full",
            "messenger_extensions": true,
          }
        ]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

const porkFourHowTo = (sender_psid) => {
  let response1 = {
    "text": "၁။ ပထမဦးဆုံးဘဲဥကိုကျက်အောင်ပြုတ်ပြီးရေအေးစိမ်ကာအခွံခွာထားပါ။\n\n၂။ သုံးထပ်သားကိုအနေတော်အတုံးငယ်များတုံးပြီးABC ပဲငံပြာရည်အပျစ်၊ ABC ပဲငံပြာရည်အ​ကြည်တို့ဖြင့်အရသာနယ်ကာ(၁၀)မိနစ်ခန့် နှပ်ထားပါ။\n\n၃။ မုန်လာဥဖြူကိုအခွံခွာပြီးတစ်လက်မအရွယ်ခပ်ထူထူ၊ခပ်စောင်းစောင်းလှီးထားပြီးဟင်းရည်ကြည်ပုံစံပြုတ်ထားပါ။\n\n၄။ ငရုတ်ကောင်းစေ့ ၊ ကြက်သွန်ဖြူ ၊ချင်း၊ နံနံပင်အမြစ်တို့ကိုခပ်ကြမ်းကြမ်းထောင်းပါ။\n\n၅။ နာနတ်ပွင့်၊သစ်ကြပိုးခေါက်တို့ကိုမွှေးရုံမီးကင်ထားပါ။\n\n၆။ ဒယ်အိုးတစ်လုံးမှာဆီများများလေးကိုအပူပေးပြီးပဲပြားကိုတြိဂံပုံနှစ်ပိုင်း ပိုင်းပြီးကြော်ယူကာဆီဆစ်ထားပါ။\n\n၇။ ပိုလျှံနေသောဆီကိုစစ်ထုတ်ပြီးလက်ကျန်ဆီအနည်းငယ်မှာ သကြားကိုဦးစွာထည့်ပါ။\n\n၈။ သကြားပျော်ပြီးရွှေညိုရောင်လေးသမ်းလာပြီဆိုလျှင်ရောထောင်းထားသောကြက်သွန်ဖြူ၊ငရုတ်ကောင်းအရောကိုဆီသပ်ပါ။\n\n၉။ မွှေးလာလျှင်အရသာနယ်ထားတဲ့ဝက်သားသုံးထပ်သားတွေထည့်ပြီးမွှေပေးပါ။\n\n၁၀။ သုံးထပ်သားတွေအပေါ်ယံကြောတင်းကာမွှေးသွားပြီဆိုမှအခွံခွာထားတဲ့ဘဲဥ၊ ကြော်ထားတဲ့ပဲပြားထည့်ကာ မုန်လာဥဟင်းရည်ကိုအဖတ်မပါစေပဲအရည်ကြည်သာစစ်ထည့်ပါ။\n\n၁၁။ (၅)မိနစ်ခန့်ပြုတ်ပြီးလျှင်ဆီစစ်ဇကာထဲသို့လောင်းချပြီးထောင်းထားသောကြက်သွန်ဖြူ၊ချင်း၊ ငရုတ်ကောင်း၊နံနံပင်အမြစ်ဖတ်များကိုဖယ်ထုတ်ပါ။\n\n၁၂။ မီးဖုတ်ထားသော နာနတ်ပွင့်၊သစ်ကြပိုးခေါက်တို့ဖြည့်စွက်ပြီးလက်ကျန်မုန်လာဥဟင်းရည်အားလုံးလောင်းထည့်ကာမီးရှိန်အေးအေးဖြင့်(၁၅) မိနှစ်ခန့် နှပ်ချက်လေးချက်ပေးပါ။"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
          "type": "web_url",
          "url": "https://new-hope-a1a0b.web.app/meals/ERWds6E6HhPBgzkwIKJV?meal=%E1%80%9E%E1%80%AF%E1%80%B6%E1%80%B8%E1%80%91%E1%80%95%E1%80%BA%E1%80%9E%E1%80%AC%E1%80%B8%E1%80%94%E1%80%BE%E1%80%84%E1%80%BA%E1%80%B7%E1%80%98%E1%80%B2%E1%80%A5%E1%80%A1%E1%80%81%E1%80%BB%E1%80%AD%E1%80%AF%E1%80%81%E1%80%BB%E1%80%80%E1%80%BA",
          "title": "ဝယ်မယ်",
          "webview_height_ratio": "full",
          "messenger_extensions": true,
        }]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

/***********************
Functions for Pork five
************************/
const porkFiveIngre = (sender_psid) => {
  let response1 = {
    "text": "ဝက်နံရိုးနု = ၃၀ကျပ်သား\n\nချင်းကြီးကြီး = ၁ တက်\n\nABC ပဲငံပြာရည်အပျစ် = ၁ ဇွန်း\n\nABCပဲငံပြာရည်အကြည် = ၂ဇွန်း\n\nအရသာမှုန့်\n\nသကြား\n\nဟင်းချက်ဆန်အရက်"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
            "type": "postback",
            "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
            "payload": "pork-five-how-to"
          },
          {
            "type": "web_url",
            "url": "https://new-hope-a1a0b.web.app/meals/8ONOD4Bz5nA2TKWWiLC7?meal=%E1%80%9D%E1%80%80%E1%80%BA%E1%80%94%E1%80%B6%E1%80%9B%E1%80%AD%E1%80%AF%E1%80%B8%E1%80%94%E1%80%AF%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA",
            "title": "ဝယ်မယ်",
            "webview_height_ratio": "full",
            "messenger_extensions": true,
          }
        ]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

const porkFiveHowTo = (sender_psid) => {
  let response1 = {
    "text": "၁။ ဝက်နံရိုးနုလေးတွေကိုအရွယ်တော်တုံးကာသန့်စင်ပြီး ချင်းထောင်းအရည်၊ ဆား၊ပဲငံပြာရည်အကြည်၊ ပဲငံပြာရည်အပျစ်၊သကြား၊ ဟင်းချက်ဆန်အရက်တို့ဖြင့်အရသာနယ်ကာ(၁၀)မိနစ်ခန့်နှပ်ထားပါ။\n\n၂။ အရသာနယ်ချိန်ပြည့်ပြီဆိုလျှင်ရေမြှုပ်ရုံထည့်ပြီးရေခမ်းအောင်ပြုတ်ပါ။\n\n၃။ ရေခမ်းသွားပြီဆိုလျှင်(၁၀)မိနစ်ခန့်အအေးခံထားပါ။\n\n၄။ ဒယ်အိုးတစ်လုံးမှာ ဆီကို ကျိုက်ကျိုက်ဆူအပူပေးပြီးဝက်နံရိုးတွေထည့်ကြော်ပါ။\n\n၅။ အထက်ပါဖော်ပြချက်များကိုလိုက်နာပါက အပြင်ပိုင်းရွှေညိုရောင်သန်းကြွပ်ရွနေပြီးအတွင်းပိုင်းနူးညံ့အိစက်နေတဲ့ဝက်နံရိုးကြော်နုနုလေးကိုရရှိမှာဖြစ်ပါတယ်။\n\nABC ငရုတ်ဆော့စ်(သို့)ဘိတ်ချဥ်လေးဖြင့်တွဲဖက်သုံးဆောင်ပါ။"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
          "type": "web_url",
          "url": "https://new-hope-a1a0b.web.app/meals/8ONOD4Bz5nA2TKWWiLC7?meal=%E1%80%9D%E1%80%80%E1%80%BA%E1%80%94%E1%80%B6%E1%80%9B%E1%80%AD%E1%80%AF%E1%80%B8%E1%80%94%E1%80%AF%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA",
          "title": "ဝယ်မယ်",
          "webview_height_ratio": "full",
          "messenger_extensions": true,
        }]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

/* FUNCTION TO FISH */
const fish = (sender_psid) => {
  let response1 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
            "title": "ငါးကြင်းမြီးစတူး",
            "image_url": "https://firebasestorage.googleapis.com/v0/b/new-hope-a1a0b.appspot.com/o/%E1%80%84%E1%80%AB%E1%80%B8%2F%E1%80%84%E1%80%AB%E1%80%B8%E1%80%80%E1%80%BC%E1%80%84%E1%80%BA%E1%80%B8%E1%80%99%E1%80%BC%E1%80%AE%E1%80%B8%E1%80%85%E1%80%90%E1%80%B0%E1%80%B8_1588501342258?alt=media&token=64fe0b53-c2d2-4513-8fa6-632f5a7da0df",
            "subtitle": "ဒီတစ်ခါ နွေရာသီပူပူမှာခံတွင်းလိုက်စေမယ့်ဟင်းလေးတစ်မယ်ဖော်ပြပေးလိုက်ပါတယ်။",
            "buttons": [{
                "type": "postback",
                "title": "ပါဝင်ပစ္စည်းများ",
                "payload": "fish-one-ingre"
              },
              {
                "type": "postback",
                "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
                "payload": "fish-one-how-to"
              },
              {
                "type": "web_url",
                "url": "https://new-hope-a1a0b.web.app/meals/IC02O6Q2Qbue40Bg3bmt?meal=%E1%80%84%E1%80%AB%E1%80%B8%E1%80%80%E1%80%BC%E1%80%84%E1%80%BA%E1%80%B8%E1%80%99%E1%80%BC%E1%80%AE%E1%80%B8%E1%80%85%E1%80%90%E1%80%B0%E1%80%B8",
                "title": "ဝယ်မယ်",
                "webview_height_ratio": "full",
                "messenger_extensions": true,
              }
            ]
          },
          {
            "title": "လျှာဒလက်လည်ငါးပိထောင်း",
            "image_url": "https://firebasestorage.googleapis.com/v0/b/new-hope-a1a0b.appspot.com/o/%E1%80%84%E1%80%AB%E1%80%B8%2F%E1%80%9C%E1%80%BB%E1%80%BE%E1%80%AC%E1%80%92%E1%80%9C%E1%80%80%E1%80%BA%E1%80%9C%E1%80%8A%E1%80%BA%E1%80%84%E1%80%AB%E1%80%B8%E1%80%95%E1%80%AD%E1%80%91%E1%80%B1%E1%80%AC%E1%80%84%E1%80%BA%E1%80%B8_1588504037617?alt=media&token=442cc29c-1b1d-43c6-9f47-d41cc03f1a1b",
            "subtitle": "ငါးပိထောင်းက နူးညံ့အိစက်နေတဲ့အတွက်သရက်သီးစိမ်းလေးနဲ့တို့မလား၊ သခွားသီးလေးနဲ့ကော်ပြီးတို့မလား၊ ထမင်းနဲ့ ဇွိကနဲနယ်စားမလား၊ စားချင်ရာနဲ့သာစားပါ။",
            "buttons": [{
                "type": "postback",
                "title": "ပါဝင်ပစ္စည်းများ",
                "payload": "fish-two-ingre"
              },
              {
                "type": "postback",
                "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
                "payload": "fish-two-how-to"
              },
              {
                "type": "web_url",
                "url": "https://new-hope-a1a0b.web.app/meals/yZx3jlOyLF7u9BGFsDqK?meal=%E1%80%9C%E1%80%BB%E1%80%BE%E1%80%AC%E1%80%92%E1%80%9C%E1%80%80%E1%80%BA%E1%80%9C%E1%80%8A%E1%80%BA%E1%80%84%E1%80%AB%E1%80%B8%E1%80%95%E1%80%AD%E1%80%91%E1%80%B1%E1%80%AC%E1%80%84%E1%80%BA%E1%80%B8",
                "title": "ဝယ်မယ်",
                "webview_height_ratio": "full",
                "messenger_extensions": true,
              }
            ]
          },
          {
            "title": "မြန်မာစတိုင်လ်ငါးရံ့သောက်ဆမ်း",
            "image_url": "https://firebasestorage.googleapis.com/v0/b/new-hope-a1a0b.appspot.com/o/%E1%80%84%E1%80%AB%E1%80%B8%2F%E1%80%99%E1%80%BC%E1%80%94%E1%80%BA%E1%80%99%E1%80%AC%E1%80%85%E1%80%90%E1%80%AD%E1%80%AF%E1%80%84%E1%80%BA%E1%80%9C%E1%80%BA%E1%80%84%E1%80%AB%E1%80%B8%E1%80%9B%E1%80%B6%E1%80%B7%E1%80%9E%E1%80%B1%E1%80%AC%E1%80%80%E1%80%BA%E1%80%86%E1%80%99%E1%80%BA%E1%80%B8_1588688831421?alt=media&token=754bc28e-0e2f-4799-95c2-280cf7b9a312",
            "subtitle": "ဒီတစ်ခါ နွေရာသီပူပူမှာခံတွင်းလိုက်စေမယ့်ဟင်းလေးတစ်မယ်ဖော်ပြပေးလိုက်ပါတယ်။",
            "buttons": [{
                "type": "postback",
                "title": "ပါဝင်ပစ္စည်းများ",
                "payload": "fish-three-ingre"
              },
              {
                "type": "postback",
                "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
                "payload": "fish-three-how-to"
              },
              {
                "type": "web_url",
                "url": "https://new-hope-a1a0b.web.app/meals/ezNlejeOhfNJDePtCk1V?meal=%E1%80%99%E1%80%BC%E1%80%94%E1%80%BA%E1%80%99%E1%80%AC%E1%80%85%E1%80%90%E1%80%AD%E1%80%AF%E1%80%84%E1%80%BA%E1%80%9C%E1%80%BA%E1%80%84%E1%80%AB%E1%80%B8%E1%80%9B%E1%80%B6%E1%80%B7%E1%80%9E%E1%80%B1%E1%80%AC%E1%80%80%E1%80%BA%E1%80%86%E1%80%99%E1%80%BA%E1%80%B8",
                "title": "ဝယ်မယ်",
                "webview_height_ratio": "full",
                "messenger_extensions": true,
              }
            ]
          }
        ]
      }
    }
  }
  let response2 = {
    "text": "Main Menu သို့ပြန်သွားလိုပါသလားခင်ဗျာ။",
    "quick_replies": [{
      "content_type": "text",
      "title": "အစသို့ပြန်သွားရန်",
      "image_url": "https://i.imgur.com/YT1qtmF.png",
      "payload": "main-menu"
    }]
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

/*********************
Functions for Fish one
**********************/
const fishOneIngre = (sender_psid) => {
  let response1 = {
    "text": "ငါးကြင်းမြီး = ၂ခု\n\nချင်းကြီးကြီး = ၁တက်\n\nကြက်သွန်ဖြူ = ၇မွှာ\n\nကြက်သွန်မြိတ် = ၅ပင်\n\nABCပဲငံပြာရည်အကြည် = ၅ဇွန်း\n\nABCပဲငံပြာရည်အပျစ် = ၁ဇွန်း\n\nခရုဆီ = ၃ဇွန်း\n\nသကြား = ၂ဇွန်း\n\nဆီမွှေး = ဇွန်း ၁ ဝက်ခန့်\n\nဆား၊ အရသာမှုန့် = အနည်းငယ်စီ"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
            "type": "postback",
            "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
            "payload": "fish-one-how-to"
          },
          {
            "type": "web_url",
            "url": "https://new-hope-a1a0b.web.app/meals/IC02O6Q2Qbue40Bg3bmt?meal=%E1%80%84%E1%80%AB%E1%80%B8%E1%80%80%E1%80%BC%E1%80%84%E1%80%BA%E1%80%B8%E1%80%99%E1%80%BC%E1%80%AE%E1%80%B8%E1%80%85%E1%80%90%E1%80%B0%E1%80%B8",
            "title": "ဝယ်မယ်",
            "webview_height_ratio": "full",
            "messenger_extensions": true,
          }
        ]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

const fishOneHowTo = (sender_psid) => {
  let response1 = {
    "text": "၁။ ငါးကြင်းမြီးကို ရေဆေးသန့်စင်ပြီးအရိုးပေါ်အသားများကိုသုံးမြှောင်းခွဲကာ၊ ဆား ၊အရသာမှုန့်နယ်ပြီး(၅)မိနစ်ခန့်နှပ်ထားပါ။\n\n၂။ ချင်းကိုအမျှင်လှီးပြီးကြက်သွန်ဖြူကိုအမြှောင်းလိုက်ပါးပါးလှီးပါ။ကြက်သွန်မြိတ်ကိုလက်တဆစ်ခန့်လှီးထားပါ။\n\n၃။ ဆီကိုအပူပေးပြီး အရသာနယ်ထားတဲ့ငါးကြင်းမြီးကိုထည့်ကြော်ပါ။အရမ်းကြွပ်စရာမလိုပဲ အသားကျက်ရုံသာကြော်ပါ။\n\n၄။ ငါးကျက်လျှင်ဆယ်ယူစစ်ထားပြီးဆီသပ်ရန်မှတပါးပိုသောဆီတွေကိုဖယ်ထုတ်ပါ။\n\n၅။ လက်ကျန်ဆီမှာ ချင်း၊ကြက်သွန်ဖြူ ကိုဆီသပ်ပါ။မွှေးလာလျှင်သကြားထည့်ပါ။\n\n၆။ သကြားပျော်ပြီးညိုလာလျှင်ABC ပဲငံပြာရည်အပျစ်၊ပဲငံပြာရည်အကြည်၊ ခရုဆီထည့်ပါ။\n\n၇။ ဆီမွှေး ၊ ဆား ၊ အရသာမှုန့်အနည်းငယ်စီထည့်ပါ။ ရေကြက်သီးနွေးလေးအနည်းငယ်ထည့်ပါ။\n\n၈။ ကြော်ထားတဲ့ငါးကြင်းမြီးထည့်ပြီးမီးရှိန်လျှော့ကာတဖျင်းဖျင်းနှပ်ပေးပါ။\n\n၉။ ငါးကြင်းကိုမကြော်ပဲအစိမ်းထည့်နှပ်နိူင်ပေမယ့်ညှီနံံ့ကြောက်သူတွေအတွက်ဒီနည်းလမ်းကအကောင်းဆုံးပါ။\n\n၁၀။ ငါးကြင်းမြီးထဲအရသာဝင်ပြီဆိုလျှင်ကြက်သွန်မြိတ်လေးဖြူးပြီးဖိုပေါ်မှချပါ။\n\nငါးကြင်းဗိုက်သားအချပ်လိုက်ကိုလဲယခုပုံစံအတိုင်းစတူးနှပ်ချက် ချက်နိူင်ပါတယ်။"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
          "type": "web_url",
          "url": "https://new-hope-a1a0b.web.app/meals/IC02O6Q2Qbue40Bg3bmt?meal=%E1%80%84%E1%80%AB%E1%80%B8%E1%80%80%E1%80%BC%E1%80%84%E1%80%BA%E1%80%B8%E1%80%99%E1%80%BC%E1%80%AE%E1%80%B8%E1%80%85%E1%80%90%E1%80%B0%E1%80%B8",
          "title": "ဝယ်မယ်",
          "webview_height_ratio": "full",
          "messenger_extensions": true,
        }]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

/*********************
Functions for Fish two
**********************/
const fishTwoIngre = (sender_psid) => {
  let response1 = {
    "text": "ပုစွန်ငါးပိကောင်းကောင်း = ၃ဇွန်း\n\nပုစွန်ခြောက် = ၁ဇွန်း\n\nငရုတ်သီးစိမ်း = ၂၀တောင့်\n\nအာဝါးသီး(ကုလားအော်သီး) = ၃တောင့်\n\nသံပုရာသီးကြီးကြီး = ၁လုံး"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
            "type": "postback",
            "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
            "payload": "fish-two-how-to"
          },
          {
            "type": "web_url",
            "url": "https://new-hope-a1a0b.web.app/meals/yZx3jlOyLF7u9BGFsDqK?meal=%E1%80%9C%E1%80%BB%E1%80%BE%E1%80%AC%E1%80%92%E1%80%9C%E1%80%80%E1%80%BA%E1%80%9C%E1%80%8A%E1%80%BA%E1%80%84%E1%80%AB%E1%80%B8%E1%80%95%E1%80%AD%E1%80%91%E1%80%B1%E1%80%AC%E1%80%84%E1%80%BA%E1%80%B8",
            "title": "ဝယ်မယ်",
            "webview_height_ratio": "full",
            "messenger_extensions": true,
          }
        ]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

const fishTwoHowTo = (sender_psid) => {
  let response1 = {
    "text": "၁။ ပထမဆုံးပုစွန်ခြောက်ကို မီးအေးအေးလေးနဲ့လှော်ပါ။\n\n၂။ စတီးပန်ကန်ပြားလေးကိုဆီအနည်းငယ်သုတ်ပြီးငါးပိတွေကို ပြန့်နေအောင်ဖြန့်ပြီးပေါင်းပါ။\n\n၃။ ငရုတ်သီးတွေကိုအညှာခြွေပြီးပြုတ်ပါ။\n\n၄။ ကျွန်တော်က ဒယ်အိုးနီနဲ့ ပုစွန်ခြောက်လှော်ပြီးငရုတ်သီးပြုတ်ပါတယ်။ ဝါးတူလေး ၄ချောင်းကိုကြက်ခြေခတ်လုပ်ပြီး ငါးပိပန်းကန်ပြားတင်ပြီးပေါင်းပါ။\n\n၅။ ငါးပိပေါင်းတဲ့အခါဘအပေါ်ကိုဖောင်းတက်လာပြီး ကွဲထွက်သွားပြီဆို ဖယ်ထုတ်အအေးခံထားပါ။\n\n၆။ ငရုတ်သီးကိုတော့ နူးအိနေအောင်ပြုတ်ပါ ။ ရေမကျန်စေရ။အအေးခံထားပါ။\n\n၇။ ပုစွန်ခြောက်ကို ဆုံထဲထည့်ပြီး မွှနေအောင်ထောင်းပါ။\n\n၈။ အအေးခံထားတဲ့ ငရုတ်သီးစိမ်းပြုတ်တွေထည့်ပြီး ညှက်စေးနေအောင်ထောင်းပါ။\n\n၉။ ငါးပိတွေကို ထည့်ပြီး ဇွန်းနဲ့ ကျည်ပွေ့ သုံးပြီးမွှေပေးပါ။ ငါးပိက မွှနေအောင်ပေါင်းထားတဲ့အတွက် ကျည်ပွေ့နဲ့ ဖိထောင်းစရာမလိုပါ။\n\n၁၀။ ထိုကဲ့သို့ မွှေနေချိန်အတွင်းဟင်းခတ်မှုန့်နှင့်သံပုရာရည် ညှစ်ထည့်ပြီး နှံ့သွားအောင်မွှေပေးပါ။"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
          "type": "web_url",
          "url": "https://new-hope-a1a0b.web.app/meals/yZx3jlOyLF7u9BGFsDqK?meal=%E1%80%9C%E1%80%BB%E1%80%BE%E1%80%AC%E1%80%92%E1%80%9C%E1%80%80%E1%80%BA%E1%80%9C%E1%80%8A%E1%80%BA%E1%80%84%E1%80%AB%E1%80%B8%E1%80%95%E1%80%AD%E1%80%91%E1%80%B1%E1%80%AC%E1%80%84%E1%80%BA%E1%80%B8",
          "title": "ဝယ်မယ်",
          "webview_height_ratio": "full",
          "messenger_extensions": true,
        }]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

/***********************
Functions for Fish three
************************/
const fishThreeIngre = (sender_psid) => {
  let response1 = {
    "text": "ငါးရံ့ခုတ်သား = ၂၀ကျပ်သား\n\nမန်ကျည်းသီးစိမ်းအရင့်= ၁၀ကျပ်သား\n\nကြက်သွန်နီ = ၁လုံး\n\nကြက်သွန်ဖြူ = ၅တက်\n\nခရမ်းချဥ်သီး = ၃လုံး\n\nစပါးလင် = ၂ပင်\n\nကုလားအော်သီး = ၃တောင့်\n\nငရုတ်သီးစိမ်းတောင့် = ၅တောင့်\n\nရှမ်းနံနံ+နံနံပင် = အနည်းငယ်စီ"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
            "type": "postback",
            "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
            "payload": "fish-three-how-to"
          },
          {
            "type": "web_url",
            "url": "https://new-hope-a1a0b.web.app/meals/ezNlejeOhfNJDePtCk1V?meal=%E1%80%99%E1%80%BC%E1%80%94%E1%80%BA%E1%80%99%E1%80%AC%E1%80%85%E1%80%90%E1%80%AD%E1%80%AF%E1%80%84%E1%80%BA%E1%80%9C%E1%80%BA%E1%80%84%E1%80%AB%E1%80%B8%E1%80%9B%E1%80%B6%E1%80%B7%E1%80%9E%E1%80%B1%E1%80%AC%E1%80%80%E1%80%BA%E1%80%86%E1%80%99%E1%80%BA%E1%80%B8",
            "title": "ဝယ်မယ်",
            "webview_height_ratio": "full",
            "messenger_extensions": true,
          }
        ]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

const fishThreeHowTo = (sender_psid) => {
  let response1 = {
    "text": "၁။ ပထမဆုံးမန်ကျည်းသီးစိမ်းတောင့်ကို ရေသုံးခွက် တစ်ခွက်တင်ပြုတ်ထားပြီးအရည်စစ်ထားပါ။\n\n၂။ ငါးရံ့အကွင်းကိုသန့်စင်ပြီးဆား၊ ငံပြာရည်၊အရသာမှုန့်ထည့်ပြီးနည်ထားပါ။\n\n၃။ ကြက်သွန်ဖြူ ၊ နီကိုရောပြီးညှက်အောင်ထောင်းထားပါ။\n\n၄။ စပါးလင်အဖြူပိုင်းကိုခပ်ထူထူစောင်းစောင်းလေးလှီးပါ။ ရှမ်းနံနံနှင့်နံနံပင်ကိုသင့်တော်သလို လှီးဖြတ်ထားပါ။\n\n၅။ ဒယ်အိုးတစ်လုံးမှာဆီအနည်းငယ်ကိုအပူပေးပြီးထောင်းထားတဲ့ကြက်သွန်အရောကိုနနွင်းမှုန့်နှင့်အတူဆီသပ်ပါ။\n\n၆။ မွှေးလာလျှင်စပါးလင်တွေထည့်ပြီးအရသာနယ်ထားတဲ့ငါးရံ့ကွင်းတွေထည့်ပါ။\n\n၇။ မီးရှိန်လျှော့ပြီးဖြေးညည်းစွာမွှေပေးပါ။\n\n၈။ ငါးအသားတွေတင်းပြီးဆိုရင် ငရုတ်သီးအတောင့်လိုက်နှင့် ခရမ်းချဥ်သီးလေးစိတ်ခွဲတွေထည့်ပါ။\n\n၉။ အဖုံးခေတ္တအုပ်ထားပေးပါ။အငွေ့ရှိန်ကြောင့်ခရမ်းချဥ်သီးနဲ့ငရုတ်သီးစိမ်းတောင့်တွေအိဆင်းလာပါလိမ့်မယ်။\n\n၁၀။ ခရမ်းချဥ်သီးတွေပုံစံမပျက်အိလာပြီဆိုမှ မန်ကျည်းသီးစိမ်းပြုတ်ရည်တစ်ဆနှင့် ရေကြက်သီးနွေး နှစ်ဆလောင်းထည့်ပါ။\n\n၁၁။ ငါးငံပြာရည်၊ သကြား၊ အရသာမှုန့်တို့နှင့်အရသာဖြည့်စွက်ပြီးအဖုံးအုပ်ကာ မီးရှိန်အေးအေးဖြင့်ချက်ပါ။\n\n၁၂။ နောက်ဆုံးရှမ်းနံနံနှင့် နံနံပင်လေးအုပ်ပြီးဖိုပေါ်မှချပါ။\n\nအရည်သောက်တော့ ချို ချဥ်မွှေးပြီးထမင်းနဲ့နယ်စားတဲ့အခါ ကုလားအော်သီး၊ ရိုးရိုးငရုတ်သီးစိမ်းတောင့်လေးတွေနဲ့နယ်စားတော့ စပ်ရှိန်းရှိန်းလေးနဲ့ အလွန်စားမြိန်တဲ့သောက်ဆမ်းလေးဟင်းတစ်ခွက်ပါ။"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
          "type": "web_url",
          "url": "https://new-hope-a1a0b.web.app/meals/ezNlejeOhfNJDePtCk1V?meal=%E1%80%99%E1%80%BC%E1%80%94%E1%80%BA%E1%80%99%E1%80%AC%E1%80%85%E1%80%90%E1%80%AD%E1%80%AF%E1%80%84%E1%80%BA%E1%80%9C%E1%80%BA%E1%80%84%E1%80%AB%E1%80%B8%E1%80%9B%E1%80%B6%E1%80%B7%E1%80%9E%E1%80%B1%E1%80%AC%E1%80%80%E1%80%BA%E1%80%86%E1%80%99%E1%80%BA%E1%80%B8",
          "title": "ဝယ်မယ်",
          "webview_height_ratio": "full",
          "messenger_extensions": true,
        }]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

/* FUNCTION TO BEEF */
const beef = (sender_psid) => {
  let response1 = {
    "text": "ဝမ်းနည်းပါတယ်ခင်ဗျ။ လူကြီးမင်းရှာသော Category “အမဲသား” အတွက် ဟင်းပွဲရှာဖွေလို့မရပါ။"
  };
  let response2 = {
    "text": "တခြား Categories တွေနဲ့ ရှာကြည့်ပါလား။",
    "quick_replies": [{
        "content_type": "text",
        "title": "ကြက်သား",
        "image_url": "https://i.imgur.com/SJTX4bn.png",
        "payload": "chicken"
      },
      {
        "content_type": "text",
        "title": "ဝက်သား",
        "image_url": "https://i.imgur.com/0Dc8Ds1.png",
        "payload": "pork"
      },
      {
        "content_type": "text",
        "title": "ငါး",
        "image_url": "https://i.imgur.com/GftmobA.png",
        "payload": "fish"
      },
      {
        "content_type": "text",
        "title": "ပင်လယ်စာ",
        "image_url": "https://i.imgur.com/mdTOS7j.png",
        "payload": "sea-food"
      }
    ]
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

/* FUNCTION TO SEAFOOD */
const seafood = (sender_psid) => {
  let response1 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
            "title": "ကင်းမွန်အချိုချက်",
            "image_url": "https://firebasestorage.googleapis.com/v0/b/new-hope-a1a0b.appspot.com/o/%E1%80%95%E1%80%84%E1%80%BA%E1%80%9C%E1%80%9A%E1%80%BA%E1%80%85%E1%80%AC%2F%E1%80%80%E1%80%84%E1%80%BA%E1%80%B8%E1%80%99%E1%80%BD%E1%80%94%E1%80%BA%E1%80%A1%E1%80%81%E1%80%BB%E1%80%AD%E1%80%AF%E1%80%81%E1%80%BB%E1%80%80%E1%80%BA.jpeg?alt=media&token=b0863152-24a5-4df6-876a-284bb75b2289",
            "subtitle": "ဒီတစ်ခါ နွေရာသီပူပူမှာခံတွင်းလိုက်စေမယ့်ဟင်းလေးတစ်မယ်ဖော်ပြပေးလိုက်ပါတယ်။",
            "buttons": [{
                "type": "postback",
                "title": "ပါဝင်ပစ္စည်းများ",
                "payload": "sf-one-ingre"
              },
              {
                "type": "postback",
                "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
                "payload": "sf-one-how-to"
              },
              {
                "type": "web_url",
                "url": "https://new-hope-a1a0b.web.app/meals/8U5AFaFTILZe5S5wv8HN?meal=%E1%80%80%E1%80%84%E1%80%BA%E1%80%B8%E1%80%99%E1%80%BD%E1%80%94%E1%80%BA%E1%80%A1%E1%80%81%E1%80%BB%E1%80%AD%E1%80%AF%E1%80%81%E1%80%BB%E1%80%80%E1%80%BA",
                "title": "ဝယ်မယ်",
                "webview_height_ratio": "full",
                "messenger_extensions": true,
              }
            ]
          },
          {
            "title": "ပဲကြာဇံနှင့်ပုစွန်ကြော်",
            "image_url": "https://firebasestorage.googleapis.com/v0/b/new-hope-a1a0b.appspot.com/o/%E1%80%95%E1%80%84%E1%80%BA%E1%80%9C%E1%80%9A%E1%80%BA%E1%80%85%E1%80%AC%2F%E1%80%95%E1%80%B2%E1%80%80%E1%80%BC%E1%80%AC%E1%80%87%E1%80%B6%E1%80%94%E1%80%BE%E1%80%84%E1%80%BA%E1%80%B7%E1%80%95%E1%80%AF%E1%80%85%E1%80%BD%E1%80%94%E1%80%BA%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA.jpeg?alt=media&token=11d419f8-c6dc-4ba0-a03b-e12826c3fb22",
            "subtitle": "ဒီဟင်းပွဲလေးက လူကြီးမင်းတို့ ဆိုင်တွေမှာ မှာစားလေးရှိတဲ့ ပုစွန်ပဲကြာဇံမြေအိုး ဆိုတဲ့ဟင်းပွဲလေးနဲ့ ခပ်ဆင်ဆင်တူပါတယ်။",
            "buttons": [{
                "type": "postback",
                "title": "ပါဝင်ပစ္စည်းများ",
                "payload": "sf-two-ingre"
              },
              {
                "type": "postback",
                "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
                "payload": "sf-two-how-to"
              },

              {
                "type": "web_url",
                "url": "https://new-hope-a1a0b.web.app/meals/NWDh7W1OAQ7V49Aoa0BN?meal=%E1%80%95%E1%80%B2%E1%80%80%E1%80%BC%E1%80%AC%E1%80%87%E1%80%B6%E1%80%94%E1%80%BE%E1%80%84%E1%80%BA%E1%80%B7%E1%80%95%E1%80%AF%E1%80%85%E1%80%BD%E1%80%94%E1%80%BA%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA",
                "title": "ဝယ်မယ်",
                "webview_height_ratio": "full",
                "messenger_extensions": true,
              }
            ]
          },
          {
            "title": "ပုစွန်နှင့်ပန်းဂေါ်ဖီးစိမ်းကြော်",
            "image_url": "https://firebasestorage.googleapis.com/v0/b/new-hope-a1a0b.appspot.com/o/%E1%80%95%E1%80%84%E1%80%BA%E1%80%9C%E1%80%9A%E1%80%BA%E1%80%85%E1%80%AC%2F%E1%80%95%E1%80%AF%E1%80%85%E1%80%BD%E1%80%94%E1%80%BA%E1%80%94%E1%80%BE%E1%80%84%E1%80%BA%E1%80%B7%E1%80%95%E1%80%94%E1%80%BA%E1%80%B8%E1%80%82%E1%80%B1%E1%80%AB%E1%80%BA%E1%80%96%E1%80%AE%E1%80%B8%E1%80%85%E1%80%AD%E1%80%99%E1%80%BA%E1%80%B8%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA_1588688443814?alt=media&token=cab10073-1182-4e22-a1bc-0c58469de5c9",
            "subtitle": "ဒီတစ်ပါတ်မှာတော့ အရွယ်သုံးပါးနှစ်သက်စေမယ့်ရိုးရှင်းတဲ့ဟင်းလျာလေးတစ်မယ်ဖော်ပြပေးလိုက်ပါတယ်။",
            "buttons": [{
                "type": "postback",
                "title": "ပါဝင်ပစ္စည်းများ",
                "payload": "sf-three-ingre"
              },
              {
                "type": "postback",
                "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
                "payload": "sf-three-how-to"
              },

              {
                "type": "web_url",
                "url": "https://new-hope-a1a0b.web.app/meals/3lE89G4NQd17alC3LisE?meal=%E1%80%95%E1%80%AF%E1%80%85%E1%80%BD%E1%80%94%E1%80%BA%E1%80%94%E1%80%BE%E1%80%84%E1%80%BA%E1%80%B7%E1%80%95%E1%80%94%E1%80%BA%E1%80%B8%E1%80%82%E1%80%B1%E1%80%AB%E1%80%BA%E1%80%96%E1%80%AE%E1%80%85%E1%80%AD%E1%80%99%E1%80%BA%E1%80%B8%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA",
                "title": "ဝယ်မယ်",
                "webview_height_ratio": "full",
                "messenger_extensions": true,
              }
            ]
          },
        ]
      }
    }
  }
  let response2 = {
    "text": "Main Menu သို့ပြန်သွားလိုပါသလားခင်ဗျာ။",
    "quick_replies": [{
      "content_type": "text",
      "title": "အစသို့ပြန်သွားရန်",
      "image_url": "https://i.imgur.com/YT1qtmF.png",
      "payload": "main-menu"
    }]
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

/************************
Functions for Seafood one
*************************/
const sfOneIngre = (sender_psid) => {
  let response1 = {
    "text": "ကင်းမွန်ငါး = ၂၀ ကျပ်သား\n\nကြက်သွန်နီ = ၁လုံး\n\nခရမ်းချဥ်သီး = ၂လုံး\n\nကောက်ရိုးမှို = ၁၀ကျပ်သား\n\nငရုတ်သီးစိမ်း = ၅တောင့်\n\nပင်စိမ်း = ၅ခက်\n\nချင်း ၊ ကြက်သွန်ဖြူ = အနည်းငယ်စီ"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
            "type": "postback",
            "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
            "payload": "sf-one-how-to"
          },
          {
            "type": "web_url",
            "url": "https://new-hope-a1a0b.web.app/meals/8U5AFaFTILZe5S5wv8HN?meal=%E1%80%80%E1%80%84%E1%80%BA%E1%80%B8%E1%80%99%E1%80%BD%E1%80%94%E1%80%BA%E1%80%A1%E1%80%81%E1%80%BB%E1%80%AD%E1%80%AF%E1%80%81%E1%80%BB%E1%80%80%E1%80%BA",
            "title": "ဝယ်မယ်",
            "webview_height_ratio": "full",
            "messenger_extensions": true,
          }
        ]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

const sfOneHowTo = (sender_psid) => {
  let response1 = {
    "text": "၁။ ပထမဆုံး ကင်းမွန်ကိုသန့်စင်ပြီးအကွင်းငယ်လေးတွေလှီးကရေနွေးဖျောအအေးခံထားပါ။\n\n၂။ ကြက်သွန်နီနှင့်ခရမ်းချဥ်သီးကို ၈စိတ်ခွဲလှီးပါ။မှိုကိုတော့ ထက်ခြမ်းခွဲလှီးပါ။\n\n၃။ ချင်းကိုအမျှင်လှီးပြီး ကြက်သွန်ဖြူကိုခပ်ပါးပါးလှီးပါ။\n\n၄။ ငရုတ်သီးစိမ်းတောင့်ကိုခပ်စောင်းစောင်းလှီးပြီးပင်စိမ်းရွက်တွေကိုခြွေထားပါ။\n\n၅။ ဒယ်အိုးတစ်လုံးမှာဆီအနည်းငယ်ကိုအပူပေးပြီး ၈ စိတ်ခွဲထားသော ကြက်သွန်နီနှင့်ခရမ်းချဥ်သီးကိုကြော်ယူဆီစစ်ထားပါ။\n\n၆။ လက်ကျန်ဆီမှာ ချင်း ၊ ကြက်သွန်ဖြူကိုဆီသပ်ပြီး ကောက်ရိုးမှိုတွေထည့်ပြီးလှိမ့်ပေးပါ။\n\n၇။ အနည်းငယ်နွမ်းသွားလျှင်ကင်းမွန်ငါးတွေထည့်ပါ။\n\n၈။ သကြား၊ အရသာမှုန့်၊ ခရုဆီ၊ ABC ပဲငံပြာရည်အကြည်၊ ABC ပဲငံပြာရည်အပျစ်တို့ဖြင့်အရသာဖြည့်စွက်ပါ။\n\n၉။ ဆီစစ်ထားတဲ့ကြက်သွန်နီ၊ ခရမ်းချဥ်သီးပြန်ထည့်ပြီး ငရုတ်သီးစိမ်း၊ ပင်စိမ်းရွက်လေးအုပ်ပြီး ဖိုပေါ်မှချပါ။"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
          "type": "web_url",
          "url": "https://new-hope-a1a0b.web.app/meals/8U5AFaFTILZe5S5wv8HN?meal=%E1%80%80%E1%80%84%E1%80%BA%E1%80%B8%E1%80%99%E1%80%BD%E1%80%94%E1%80%BA%E1%80%A1%E1%80%81%E1%80%BB%E1%80%AD%E1%80%AF%E1%80%81%E1%80%BB%E1%80%80%E1%80%BA",
          "title": "ဝယ်မယ်",
          "webview_height_ratio": "full",
          "messenger_extensions": true,
        }]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

/************************
Functions for Seafood two
*************************/
const sfTwoIngre = (sender_psid) => {
  let response1 = {
    "text": "ပဲကြာဇံ = ၁၀ကျပ်သား\n\nပုစွန်လတ် = ၇ကောင်ခန့်\n\nကြက်သွန်နီ = ၁လုံး\n\nကြက်သွန်ဖြူ = ၃တက်\n\nဘဲဥ (သို့) ကြက် ဥ\n\nပန်းပွင့်စိမ်း((သို့)ပန်းဂေါ်ဖီဥနီ\n\nဂေါ်ဖီ (သို့) မုန်ညှင်းဖြူ \n\nကြက်သွန်မြိတ်\n\nABC ပဲငံပြာရည်အကြည်\n\nABC ပဲငံပြာရည်အပျစ်\n\nခရုဆီ"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
            "type": "postback",
            "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
            "payload": "sf-two-how-to"
          },
          {
            "type": "web_url",
            "url": "https://new-hope-a1a0b.web.app/meals/NWDh7W1OAQ7V49Aoa0BN?meal=%E1%80%95%E1%80%B2%E1%80%80%E1%80%BC%E1%80%AC%E1%80%87%E1%80%B6%E1%80%94%E1%80%BE%E1%80%84%E1%80%BA%E1%80%B7%E1%80%95%E1%80%AF%E1%80%85%E1%80%BD%E1%80%94%E1%80%BA%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA",
            "title": "ဝယ်မယ်",
            "webview_height_ratio": "full",
            "messenger_extensions": true,
          }
        ]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

const sfTwoHowTo = (sender_psid) => {
  let response1 = {
    "text": "၁။ ပထမဆုံး ပဲကြာဇံ ကို (၁)နာရီခန့်ရေကြိုစိမ်ထားပါ။\n\n၂။ ပုစွန်တွေကို အခွံခွာသန့်စင်ပြီးအရသာနယ်ထားပါ။\n\n၃။ အသီးအရွက်တွေကိုမိမိစိတ်ကြိုက်လှီးဖြတ်ထားပါ။\n\n၄။ ဒယ်အိုးတစ်လုံးကိုအပူပေးပြီးဆီအနည်းငယ်မှာ ပုစွန်တွေကိုဦးစွာအိုးကင်းပူပေးပြီးဆီစစ်ထားပါ။\n\n၅။ ထိုအိုးထဲမှာပဲ ဆီအနည်းငယ်ဖြင့် ကြက်ဥကိုမွှေကြော်ပါ။\n\n၆။ ခပ်ကြမ်းကြမ်းလှီးထားသောကြက်သွန်နီနှင့်ဓားပြားရိုက်ထားသော ကြက်သွန်ဖြူကိုဆီသပ်ပါ။\n\n၇။ မွှေးလာလျှင် ကြက်သွန်မြိတ်မှလွဲပြီးတခြားအသီးအရွက်တွေထည့်ကြော်ပါ။\n\n၈။ ABCပဲငံပြာရည်အပျစ်၊ ABCပဲငံပြာရည်အကျဲ၊ ခရုဆီ ၊သကြား၊ အရသာမှုန့်တို့ဖြင့်အရသာဖြည့်စွက်ပါ။\n\n၉။ အရိုးပြုတ်ရည်(သို့)ရေနွေးလေးအနည်းငယ်ထည့်ပြီး ရေစိမ်ထားတဲ့ပဲကြာဇံတွေထည့်ပြီးအဖုံးအုပ်ထားပါ။\n\n၁၀။ ရေခမ်းလာလျှင် ပဲကြာဇံနှင့်အသီးအရွက်တွေသမသွားအောင်မွှေပေးပြီးပုစွန်တွေပြန်ထည့်ပါ။\n\n၁၁။ ကြာဇံတွေအိသွားပြီဆိုလျှင်ငရုတ်ကောင်းမှုန့်ဖြူးပြီး လက်တဆစ်ခန့်လှီးထားသောကြက်သွန်မြိတ်တွေထည့်မွှေကာဖိုပေါ်မှချပါ။\n\nမှတ်ချက်။ ပဲကြာဇံကိုအရမ်းအိပြဲသွားအောင်မကြော်ရပါ။ ကြာဇံကိုရေပြည့်ဝစွာစိမ်ထားလျှင်ကြော်ချိန်(၅)မိနစ်ခန့်မျှသာကြာပါမည်။"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
          "type": "web_url",
          "url": "https://new-hope-a1a0b.web.app/meals/NWDh7W1OAQ7V49Aoa0BN?meal=%E1%80%95%E1%80%B2%E1%80%80%E1%80%BC%E1%80%AC%E1%80%87%E1%80%B6%E1%80%94%E1%80%BE%E1%80%84%E1%80%BA%E1%80%B7%E1%80%95%E1%80%AF%E1%80%85%E1%80%BD%E1%80%94%E1%80%BA%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA",
          "title": "ဝယ်မယ်",
          "webview_height_ratio": "full",
          "messenger_extensions": true,
        }]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

/**************************
Functions for Seafood three
***************************/
const sfThreeIngre = (sender_psid) => {
  let response1 = {
    "text": "ပုစွန်ခွာပြီး = ၁၀ သား\n\nပန်းဂေါ်ဖီစိမ်း = ၁ခု\n\nကြက်သွန်ဖြူ = ၃တက်\n\nချင်းသေးသေး = ၁တက်\n\nABC ပဲငံပြာရည်အကြည်\n\nခရုဆီ\n\nပြောင်းမှုန့်(သို့)ကော်မှုန့်"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
            "type": "postback",
            "title": "ချက်ပြုတ်ရန်နည်းလမ်း",
            "payload": "sf-three-how-to"
          },
          {
            "type": "web_url",
            "url": "https://new-hope-a1a0b.web.app/meals/3lE89G4NQd17alC3LisE?meal=%E1%80%95%E1%80%AF%E1%80%85%E1%80%BD%E1%80%94%E1%80%BA%E1%80%94%E1%80%BE%E1%80%84%E1%80%BA%E1%80%B7%E1%80%95%E1%80%94%E1%80%BA%E1%80%B8%E1%80%82%E1%80%B1%E1%80%AB%E1%80%BA%E1%80%96%E1%80%AE%E1%80%85%E1%80%AD%E1%80%99%E1%80%BA%E1%80%B8%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA",
            "title": "ဝယ်မယ်",
            "webview_height_ratio": "full",
            "messenger_extensions": true,
          }
        ]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

const sfThreeHowTo = (sender_psid) => {
  let response1 = {
    "text": "၁။ ပုစွန်တွေကိုအခွံခွာသန့်စင်ထားပါ။အကောင်ကြီးပါကထက်ခြမ်းခွဲထားပါ။\n\n၂။ ပန်းဂေါ်ဖီစိမ်း ကိုအခက်ငယ်လေးများအဖြစ်သင်ယူပြီးဆားပါသောရေမှာနှစ်ကြိမ်ခန့်ရေဆေးကာစစ်ထားပါ။\n\n၃။ ကြက်သွန်ဖြူကိုခပ်ကြမ်းကြမ်းစဥ်းပြီး ချင်းကိုအမျှင်လေးတွေလှီးပါ။\n\n၄။ ကော်မှုန့်(သို့)ပြောင်းမှုန့်ကိုရေဖျော်ထားပါ။\n\n၅။ ဒယ်အိုးတစ်လုံးမှာဆီအနည်းကိုအပူပေးပြီးပုစွန်တွေကိုဆီပူထိုးပြီးဆယ်ယူထားပါ။\n\n၆။ လက်ကျန်ဆီထဲမှာ ချင်း ၊ ကြက်သွန်ဖြူ ကိုမွှေးအောင်ဆီသပ်ပြီးပန်းစိမ်းတွေထည့်ပါ။\n\n၇။ အနည်းငယ်နွမ်းလာလျှင် ABC ပဲငံပြာရည်အကြည် ၊ အရသာမှုန့်၊ သကြား ၊ ခရုဆီတို့ဖြင့်အရသာဖြည့်စွက်ပါ။\n\n၈။ ဆီပူထိုးထားတဲ့ပုစွန်တွေထည့်ပြီးဟင်းရွက်ပြုတ်ရည်လေးအနည်းငယ်ထည့်ပြီးမွှေပေးပါ။\n\n၉။ နောက်ဆုံးမှာ အနည်းငယ်ပျစ်သွား​စရန်ေကော်ရည်လေးလောင်းထည့်မွှေပါ။ငရုတ်ကောင်းမှုန့်လေးဖြူးပါ။"
  };
  let response2 = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "မိမိလိုအပ်သောပါဝင်ပစ္စည်းများကို “ဝယ်မယ်” ဆိုတဲ့ Button လေးကိုနှိပ်ပြီး ရှာဖွေဝယ်ယူနိုင်ပါတယ်နော်",
        "buttons": [{
          "type": "web_url",
          "url": "https://new-hope-a1a0b.web.app/meals/3lE89G4NQd17alC3LisE?meal=%E1%80%95%E1%80%AF%E1%80%85%E1%80%BD%E1%80%94%E1%80%BA%E1%80%94%E1%80%BE%E1%80%84%E1%80%BA%E1%80%B7%E1%80%95%E1%80%94%E1%80%BA%E1%80%B8%E1%80%82%E1%80%B1%E1%80%AB%E1%80%BA%E1%80%96%E1%80%AE%E1%80%85%E1%80%AD%E1%80%99%E1%80%BA%E1%80%B8%E1%80%80%E1%80%BC%E1%80%B1%E1%80%AC%E1%80%BA",
          "title": "ဝယ်မယ်",
          "webview_height_ratio": "full",
          "messenger_extensions": true,
        }]
      }
    }
  };
  callSend(sender_psid, response1).then(() => {
    return callSend(sender_psid, response2);
  });
}

// const meals = (sender_psid) => {

//   db.collection('meals').get()
//     .then((snapshot) => {
//       let elementItems = [];

//       snapshot.forEach((doc) => {

//         var obj = {};
//         //obj._id  = doc.id ;        
//         obj.title = doc.data().name;

//         obj.image_url = doc.data().imageUrl;
//         obj.buttons = [{
//           "type": "web_url",
//           "title": "BOOK NOW",
//           "url": "https://www.google.com"
//         }];

//         elementItems.push(obj);

//       });

//       let response = {
//         "attachment": {
//           "type": "template",
//           "payload": {
//             "template_type": "generic",
//             "image_aspect_ratio": "square",
//             "elements": elementItems
//           }
//         }
//       }

//       console.log("RESPONSE", response);
//       console.log("SENDER", sender_psid, );
//       callSend(sender_psid, response);
//     })
//     .catch((err) => {
//       console.log('Error getting documents', err);
//     });

// }


const getUserProfile = (sender_psid) => {
  return new Promise(resolve => {
    request({
      "uri": "https://graph.facebook.com/" + sender_psid + "?fields=first_name,last_name,profile_pic&access_token=EAAlEhr6zR98BAMDtTpHYVJZBo60fKlc0buAhPYq2pCFMS1NOFFb8SKbs5H8gq6xXuI7xsp7jObM63FLLwIGZC2dsYtzeC7G0QElYOBeBuTtJ8D9uhQ5Hzu20Gj0nTDrFJbZC0nssueQsXRzpeCBZChfmj3DdqxZAsxfSzZCL2cDZBM22qijNTMBTXIxQP0ph48ZD",
      "method": "GET"
    }, (err, res, body) => {
      if (!err) {
        let data = JSON.parse(body);
        resolve(data);
      } else {
        console.error("Error:" + err);
      }
    });
  });
}

const callSendAPI = (sender_psid, response) => {
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }

  return new Promise(resolve => {
    request({
      "uri": "https://graph.facebook.com/v2.6/me/messages",
      "qs": {
        "access_token": PAGE_ACCESS_TOKEN
      },
      "method": "POST",
      "json": request_body
    }, (err, res, body) => {
      if (!err) {
        resolve('message sent!')
      } else {
        console.error("Unable to send message:" + err);
      }
    });
  });
}

async function callSend(sender_psid, response) {
  let send = await callSendAPI(sender_psid, response);
  return 1;
}

/*************************************
FUNCTION TO SET UP GET STARTED BUTTON
**************************************/
const setupGetStartedButton = (res) => {
  let messageData = {
    "get_started": {
      "payload": "get_started"
    }
  };

  request({
      url: 'https://graph.facebook.com/v2.6/me/messenger_profile?access_token=' + PAGE_ACCESS_TOKEN,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      form: messageData
    },
    function (error, response, body) {
      if (!error && response.statusCode == 200) {
        res.send(body);
      } else {
        // TODO: Handle errors
        res.send(body);
      }
    });
}

/**********************************
FUNCTION TO SET UP PERSISTENT MENU
***********************************/
const setupPersistentMenu = (res) => {
  var messageData = {
    "persistent_menu": [{
        "locale": "default",
        "composer_input_disabled": false,
        "call_to_actions": [{
            "title": "Menu",
            "type": "nested",
            "call_to_actions": [{
                "type": "web_url",
                "title": "My Orders",
                "url": "https://new-hope-a1a0b.web.app/my/orders",
                "webview_height_ratio": "full",
                "messenger_extensions": true,
              },
              {
                "title": "Search a meal",
                "type": "postback",
                "payload": "search-meals"
              },
              {
                "title": "Myanmar",
                "type": "postback",
                "payload": "mm-lan"
              },
              {
                "title": "English",
                "type": "postback",
                "payload": "eng-lan"
              },
            ]
          },
          {
            "type": "web_url",
            "url": "https://new-hope-a1a0b.web.app/helps",
            "title": "Helps",
            "webview_height_ratio": "full",
            "messenger_extensions": true,
          }
        ]
      },
      {
        "locale": "zh_CN",
        "composer_input_disabled": false
      }
    ]
  };
  // Start the request
  request({
      url: 'https://graph.facebook.com/v2.6/me/messenger_profile?access_token=' + PAGE_ACCESS_TOKEN,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      form: messageData
    },
    function (error, response, body) {
      if (!error && response.statusCode == 200) {
        // Print out the response body
        res.send(body);

      } else {
        // TODO: Handle errors
        res.send(body);
      }
    });
}

/***********************
FUNCTION TO REMOVE MENU
************************/
const removePersistentMenu = (res) => {
  var messageData = {
    "fields": [
      "persistent_menu",
      "get_started"
    ]
  };
  request({
      url: 'https://graph.facebook.com/v2.6/me/messenger_profile?access_token=' + PAGE_ACCESS_TOKEN,
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      form: messageData
    },
    function (error, response, body) {
      if (!error && response.statusCode == 200) {
        res.send(body);
      } else {
        res.send(body);
      }
    });
}

/***********************************
FUNCTION TO ADD WHITELIST DOMAIN
************************************/
const whitelistDomains = (res) => {
  var messageData = {
    "whitelisted_domains": [
      "https://new-hope-a1a0b.web.app",
      "https://firebase.google.com"
    ]
  };
  request({
      url: 'https://graph.facebook.com/v2.6/me/messenger_profile?access_token=' + PAGE_ACCESS_TOKEN,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      form: messageData
    },
    function (error, response, body) {
      if (!error && response.statusCode == 200) {
        res.send(body);
      } else {
        res.send(body);
      }
    });
}