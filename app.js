'use strict';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const APP_URL = process.env.APP_URL;

// Imports dependencies and set up http server
const { uuid } = require('uuidv4'), { format } = require('util'),
    request = require('request'),
    express = require('express'),
    body_parser = require('body-parser'),
    firebase = require("firebase-admin"),
    ejs = require("ejs"),
    fs = require('fs'),
    multer = require('multer'),
    app = express();

const uuidv4 = uuid();
const session = require('express-session');

app.use(body_parser.json());
app.use(body_parser.urlencoded());
app.set('trust proxy', 1);
app.use(session({ secret: 'effystonem' }));
app.use(express.static(__dirname + '/public'));


const bot_questions = {
    "q1": "Please enter your full name",
    "q2": "Please enter your phone number",
    "q3": "Please enter your address",
    "q4": "Please enter your order reference number"
}

let sess;

let current_question = '';
let user_id = '';
let userInputs = [];
let first_reg = false;
let customer = [];


let temp_points = 0;
let cart_total = 0;
let cart_discount = 0;

/*
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
})*/

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 //no larger than 5mb
    }

});

// parse application/x-www-form-urlencoded


app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
// app.set('views', path.join(__dirname, 'views'));


var firebaseConfig = {
    credential: firebase.credential.cert({
        "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        "client_email": process.env.FIREBASE_CLIENT_EMAIL,
        "project_id": process.env.FIREBASE_PROJECT_ID,
    }),
    databaseURL: process.env.FIREBASE_DB_URL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
};



firebase.initializeApp(firebaseConfig);

let db = firebase.firestore();
let bucket = firebase.storage().bucket();

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {

    // Parse the request body from the POST
    let body = req.body;





    // Check the webhook event is from a Page subscription
    if (body.object === 'page') {
        body.entry.forEach(function(entry) {

            let webhook_event = entry.messaging[0];
            let sender_psid = webhook_event.sender.id;

            user_id = sender_psid;

            if (!userInputs[user_id]) {
                userInputs[user_id] = {};
                customer[user_id] = {};
            }


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


app.use('/uploads', express.static('uploads'));


app.get('/', function(req, res) {
    res.send('your app is up and running');
});

// Start Login & Logout\
app.post('/login', function(req, res) {
    sess = req.session;

    let email = req.body.email;
    let password = req.body.password;

    if (email == 'admin@gmail.com' && password == process.env.ADMIN_PW) {
        sess.email = 'admin@gmail.com';
        sess.login = true;
        res.redirect('/admin/orders');
    } else {
        res.send('login failed');
    }
});

app.get('/login', function(req, res) {
    sess = req.session;

    if (sess.login) {
        res.redirect('/admin/orders');
    } else {
        res.render('login.ejs');
    }

});

app.get('/admin/logout', function(req, res) {
    //sess = req.session;   
    req.session.destroy(null);
    res.redirect('../login');
});

// End Login & Logout

app.get('/admin/products', async (req, res) => {

    const productsRef = db.collection('products').orderBy('created_on', 'desc');
    const snapshot = await productsRef.get();

    if (snapshot.empty) {
        res.send('no data');
    } else {
        let data = [];

        snapshot.forEach(doc => {
            let product = {};

            product = doc.data();
            product.doc_id = doc.id;

            let d = new Date(doc.data().created_on._seconds);
            d = d.toString();
            product.created_on = d;


            data.push(product);

        });
        sess = req.session;
        console.log('SESS:', sess);
        if (sess.login) {
            res.render('products.ejs', {
                data: data
            });
        } else {
            res.send('you are not authorized to view this page');
        }
    }
});

app.get('/admin/addproduct', async function(req, res) {
    sess = req.session;
    console.log('SESS:', sess);
    if (sess.login) {
        res.render('addproduct.ejs');
    } else {
        res.send('you are not authorized to view this page');
    }
});

app.post('/admin/saveproduct', upload.single('file'), function(req, res) {

    let name = req.body.name;
    let description = req.body.description;
    let img_url = "";
    let price = parseInt(req.body.price);
    let category = req.body.category;

    let today = new Date();

    let file = req.file;
    if (file) {
        uploadImageToStorage(file).then((img_url) => {
            db.collection('products').add({
                name: name,
                description: description,
                image: img_url,
                price: price,
                category: category,
                created_on: today
            }).then(success => {
                console.log("DATA SAVED")
                res.redirect('../admin/products');
            }).catch(error => {
                console.log(error);
            });
        }).catch((error) => {
            console.error(error);
        });
    }
});

// customers
app.get('/admin/customers', async (req, res) => {

    const usersRef = db.collection('users').orderBy('created_on', 'desc');
    const snapshot = await usersRef.get();

    if (snapshot.empty) {
        res.send('no data');
    } else {
        let data = [];

        snapshot.forEach(doc => {
            let user = {};

            user = doc.data();
            user.doc_id = doc.id;

            let d = new Date(doc.data().created_on._seconds);
            d = d.toString();
            user.created_on = d;


            data.push(user);

        });
        sess = req.session;
        console.log('SESS:', sess);
        if (sess.login) {
            res.render('customers.ejs', {
                data: data
            });
        } else {
            res.send('you are not authorized to view this page');
        }
    }
});

app.get('/admin/orders', async (req, res) => {
    // pending orders
    const pendingOrdersRef = db.collection('orders').where('status', '==', 'pending');
    const snapshotPending = await pendingOrdersRef.get();

    // processing orders
    const processingOrdersRef = db.collection('orders').where('status', '==', 'processing');
    const snapshotProcessing = await processingOrdersRef.get();

    // completed orders
    const completedOrdersRef = db.collection('orders').where('status', '==', 'completed');
    const snapshotCompleted = await completedOrdersRef.get();

    // canceled orders
    const canceledOrdersRef = db.collection('orders').where('status', '==', 'canceled');
    const snapshotCanceled = await canceledOrdersRef.get();


    if (
        snapshotPending.empty && 
        snapshotProcessing.empty &&
        snapshotCompleted.empty &&
        snapshotCanceled.empty) {
        res.send('no data');
    } else {

        let pendingOrders = [];
        let processingOrders = [];
        let completedOrders = [];
        let canceledOrders = [];
        // pending orders
        snapshotPending.forEach(doc => {
            let order = {};

            order = doc.data();
            order.doc_id = doc.id;

            // let d = new Date(doc.data().created_on._seconds);
            // d = d.toString();
            // order.created_on = d;

            pendingOrders.push(order);

        });

        // processing orders
        snapshotProcessing.forEach(doc => {
            let order = {};

            order = doc.data();
            order.doc_id = doc.id;

            // let d = new Date(doc.data().created_on._seconds);
            // d = d.toString();
            // order.created_on = d;

            processingOrders.push(order);
        });
        // completed orders
        snapshotCompleted.forEach(doc => {
            let order = {};

            order = doc.data();
            order.doc_id = doc.id;

            // let d = new Date(doc.data().created_on._seconds);
            // d = d.toString();
            // order.created_on = d;

            completedOrders.push(order);
        });

        // canceled orders
        snapshotCanceled.forEach(doc => {
            let order = {};

            order = doc.data();
            order.doc_id = doc.id;

            // let d = new Date(doc.data().created_on._seconds);
            // d = d.toString();
            // order.created_on = d;

            canceledOrders.push(order);
        });

        sess = req.session;
        console.log('SESS:', sess);
        if (sess.login) {
            res.render('order_records.ejs', {
                pendingOrders:pendingOrders,
                processingOrders:processingOrders,
                completedOrders:completedOrders,
                canceledOrders:canceledOrders
            });
        } else {
            res.send('you are not authorized to view this page');
        }
    }
});

// Order Detail
app.get('/admin/orderDetail/:doc_id', async function(req, res) {
    let doc_id = req.params.doc_id;
    const orderRef = db.collection('orders').doc(doc_id);
    const doc = await orderRef.get();
    if (!doc.exists) {
        console.log('No such document!');
    } else {
        console.log('Document data:', doc.data());
        let data = doc.data();
        data.doc_id = doc.id;
        console.log('Document data:', data);
        res.render('orderDetail.ejs', {
            data: data
        });
    }
});

app.get('/admin/update_order/:doc_id', async function(req, res) {
    let doc_id = req.params.doc_id;

    const orderRef = db.collection('orders').doc(doc_id);
    const doc = await orderRef.get();
    if (!doc.exists) {
        console.log('No such document!');
    } else {

        let data = doc.data();
        data.doc_id = doc.id;

        res.render('update_order.ejs', {
            data: data
        });
    }
});

// Processing order
app.post('/admin/update_order_process', function(req, res) {

    // let data = {
    //     status: "processing",
    // }

    db.collection('orders').doc(req.body.doc_id)
        .update({status: "processing"}).then(() => {
            res.redirect('/admin/orders');
        }).catch((err) => console.log('ERROR:', error));
});

// Completed order
app.post('/admin/update_order_complete', function(req, res) {

    // let data = {
    //     status: "processing",
    // }

    db.collection('orders').doc(req.body.doc_id)
        .update({status: "completed"}).then(() => {
            res.redirect('/admin/orders');
        }).catch((err) => console.log('ERROR:', error));
});

// Canceled order

app.post('/admin/update_order_cancel', function(req, res) {

    // let data = {
    //     status: "processing",
    // }

    db.collection('orders').doc(req.body.doc_id)
        .update({status: "canceled"}).then(() => {
            res.redirect('/admin/orders');
        }).catch((err) => console.log('ERROR:', error));
});

// Delete order
app.post('/admin/deleteOrder', function(req,res){
    db.collection('orders').doc(req.body.doc_id).delete().then(() => {
        res.redirect('/admin/orders');
    }).catch((err) => console.log('ERROR:', error));
});

// Delete product
app.post('/admin/deleteProduct', function(req,res){
    db.collection('products').doc(req.body.doc_id).delete().then(() => {
        res.redirect('/admin/products');
    }).catch((err) => console.log('ERROR:', error));
});

//route url
// ALL CATEGORIES
app.get('/shop', async function(req, res) {

    customer[user_id].id = user_id;

    const userRef = db.collection('users').doc(user_id);
    const user = await userRef.get();
    if (!user.exists) {
        customer[user_id].name = "";
        customer[user_id].phone = "";
        customer[user_id].address = "";
        customer[user_id].points = 0;

    } else {
        customer[user_id].name = user.data().name;
        customer[user_id].phone = user.data().phone;
        customer[user_id].address = user.data().address;

        customer[user_id].points = user.data().points;
    }


    const productsRef = db.collection('products').orderBy('created_on', 'desc');
    const snapshot = await productsRef.get();

    if (snapshot.empty) {
        res.send('no data');
    }

    let data = [];

    snapshot.forEach(doc => {

        let product = {};

        product = doc.data();

        product.id = doc.id;

        let d = new Date(doc.data().created_on._seconds);
        d = d.toString();
        product.created_on = d;

        data.push(product);

    });

    //console.log('DATA:', data); 
    res.render('shop.ejs', { data: data });
});

// START BREAKFASTFOOD CATEGORY
app.get('/breakfast_food', async function(req, res) {

    customer[user_id].id = user_id;

    const userRef = db.collection('users').doc(user_id);
    const user = await userRef.get();
    if (!user.exists) {
        customer[user_id].name = "";
        customer[user_id].phone = "";
        customer[user_id].address = "";
        customer[user_id].points = 0;

    } else {
        customer[user_id].name = user.data().name;
        customer[user_id].phone = user.data().phone;
        customer[user_id].address = user.data().address;

        customer[user_id].points = user.data().points;
    }


    const productsRef = db.collection('products').where("category", "==", "Breakfast Food");
    const snapshot = await productsRef.get();

    if (snapshot.empty) {
        res.send('no data');
    }

    let data = [];

    snapshot.forEach(doc => {

        let product = {};

        product = doc.data();

        product.id = doc.id;

        let d = new Date(doc.data().created_on._seconds);
        d = d.toString();
        product.created_on = d;

        data.push(product);

    });

    //console.log('DATA:', data); 
    res.render('breakfast_food.ejs', { data: data });
});
// END BREAKFASTFOOD CATEGORY

// START LUNCHFOOD CATEGORY
app.get('/lunch_food', async function(req, res) {

    customer[user_id].id = user_id;

    const userRef = db.collection('users').doc(user_id);
    const user = await userRef.get();
    if (!user.exists) {
        customer[user_id].name = "";
        customer[user_id].phone = "";
        customer[user_id].address = "";
        customer[user_id].points = 0;

    } else {
        customer[user_id].name = user.data().name;
        customer[user_id].phone = user.data().phone;
        customer[user_id].address = user.data().address;

        customer[user_id].points = user.data().points;
    }


    const productsRef = db.collection('products').where("category", "==", "Lunch Food");
    const snapshot = await productsRef.get();

    if (snapshot.empty) {
        res.send('no data');
    }

    let data = [];

    snapshot.forEach(doc => {

        let product = {};

        product = doc.data();

        product.id = doc.id;

        let d = new Date(doc.data().created_on._seconds);
        d = d.toString();
        product.created_on = d;

        data.push(product);

    });

    //console.log('DATA:', data); 
    res.render('lunch_food.ejs', { data: data });
});
// END LUNCHFOOD CATEGORY

// START CHINESEFOOD CATEGORY
app.get('/chinese_food', async function(req, res) {

    customer[user_id].id = user_id;

    const userRef = db.collection('users').doc(user_id);
    const user = await userRef.get();
    if (!user.exists) {
        customer[user_id].name = "";
        customer[user_id].phone = "";
        customer[user_id].address = "";
        customer[user_id].points = 0;

    } else {
        customer[user_id].name = user.data().name;
        customer[user_id].phone = user.data().phone;
        customer[user_id].address = user.data().address;

        customer[user_id].points = user.data().points;
    }


    const productsRef = db.collection('products').where("category", "==", "Chinese Food");
    const snapshot = await productsRef.get();

    if (snapshot.empty) {
        res.send('no data');
    }

    let data = [];

    snapshot.forEach(doc => {

        let product = {};

        product = doc.data();

        product.id = doc.id;

        let d = new Date(doc.data().created_on._seconds);
        d = d.toString();
        product.created_on = d;

        data.push(product);

    });

    //console.log('DATA:', data); 
    res.render('chinese_food.ejs', { data: data });
});
// END CHINESEFOOD CATEGORY

// START JUICE CATEGORY
app.get('/juice', async function(req, res) {

    customer[user_id].id = user_id;

    const userRef = db.collection('users').doc(user_id);
    const user = await userRef.get();
    if (!user.exists) {
        customer[user_id].name = "";
        customer[user_id].phone = "";
        customer[user_id].address = "";
        customer[user_id].points = 0;

    } else {
        customer[user_id].name = user.data().name;
        customer[user_id].phone = user.data().phone;
        customer[user_id].address = user.data().address;

        customer[user_id].points = user.data().points;
    }


    const productsRef = db.collection('products').where("category", "==", "Juice");
    const snapshot = await productsRef.get();

    if (snapshot.empty) {
        res.send('no data');
    }

    let data = [];

    snapshot.forEach(doc => {

        let product = {};

        product = doc.data();

        product.id = doc.id;

        let d = new Date(doc.data().created_on._seconds);
        d = d.toString();
        product.created_on = d;

        data.push(product);

    });

    //console.log('DATA:', data); 
    res.render('juice.ejs', { data: data });
});
// END JUICE CATEGORY

app.post('/cart', function(req, res) {

    if (!customer[user_id].cart) {
        customer[user_id].cart = [];
    }

    let item = {};
    item.id = req.body.item_id;
    item.name = req.body.item_name;
    item.img = req.body.item_img;
    item.description = req.body.item_description;
    item.price = parseInt(req.body.item_price);
    item.qty = parseInt(req.body.item_qty);
    item.total = item.price * item.qty;


    const itemInCart = (element) => element.id == item.id;
    let item_index = customer[user_id].cart.findIndex(itemInCart);

    if (item_index < 0) {
        customer[user_id].cart.push(item);
    } else {
        customer[user_id].cart[item_index].qty = item.qty;
        customer[user_id].cart[item_index].total = item.total;
    }

    res.redirect('../cart');
});


app.get('/cart', function(req, res) {
    temp_points = customer[user_id].points;
    let sub_total = 0;
    cart_total = 0;
    cart_discount = 0;

    if (!customer[user_id].cart) {
        customer[user_id].cart = [];
    }
    if (customer[user_id].cart.length < 1) {
        res.send('your cart is empty. back to shop <a href="../shop">shop</a>');
    } else {

        customer[user_id].cart.forEach((item) => sub_total += item.total);

        cart_total = sub_total - cart_discount;

        customer[user_id].use_point = false;

        res.render('cart.ejs', { cart: customer[user_id].cart, sub_total: sub_total, user: customer[user_id], cart_total: cart_total, discount: cart_discount, points: temp_points });
    }
});



app.get('/emptycart', function(req, res) {
    customer[user_id].cart = [];
    customer[user_id].use_point = false;
    //customer[user_id].points = 400;
    cart_discount = 0;
    res.redirect('../cart');
});


app.post('/pointdiscount', function(req, res) {

    //temp_points = customer[user_id].points; 
    let sub_total = 0;
    //cart_total = 0;
    //cart_discount = 0;

    if (!customer[user_id].cart) {
        customer[user_id].cart = [];
    }
    if (customer[user_id].cart.length < 1) {
        res.send('your cart is empty. back to shop <a href="../shop">shop</a>');
    } else {
        customer[user_id].use_point = true;

        customer[user_id].cart.forEach((item) => sub_total += item.total);

        console.log('BEFORE');
        console.log('sub total:' + sub_total);
        console.log('cart total:' + cart_total);
        console.log('cart discount:' + cart_discount);
        console.log('temp points:' + temp_points);

        if (sub_total != 0 || cart_total != 0) {
            if (sub_total >= parseInt(req.body.points)) {
                console.log('Point is smaller than subtotal');
                cart_discount = parseInt(req.body.points);
                cart_total = sub_total - cart_discount;
                temp_points = 0;

            } else {
                console.log('Point is greater than subtotal');
                cart_discount = sub_total;
                cart_total = 0;
                temp_points -= sub_total;

            }

        }



        console.log('AFTER');
        console.log('sub total:' + sub_total);
        console.log('cart total:' + cart_total);
        console.log('cart discount:' + cart_discount);
        console.log('temp points:' + temp_points);

        res.render('cart.ejs', { cart: customer[user_id].cart, sub_total: sub_total, user: customer[user_id], cart_total: cart_total, discount: cart_discount, points: temp_points });
    }
});


app.get('/order', function(req, res) {
    let sub_total;

    if (!customer[user_id].cart) {
        customer[user_id].cart = [];
    }
    if (customer[user_id].cart.length < 1) {
        res.send('your cart is empty. back to shop <a href="../shop">shop</a>');
    } else {
        sub_total = 0;
        customer[user_id].cart.forEach((item) => sub_total += item.total);

        let item_list = "";
        customer[user_id].cart.forEach((item) => item_list += item.name + '*' + item.qty);

        res.render('order.ejs', {
            cart: customer[user_id].cart,
            sub_total: sub_total,
            user: customer[user_id],
            cart_total: cart_total,
            discount: cart_discount,
            items: item_list
        });
    }
});

app.post('/order', function(req, res) {
    // let today = new Date();

    let dateObj = new Date();
    let month = ('0' + (dateObj.getMonth() + 1)).slice(-2);
    let date = ('0' + dateObj.getDate()).slice(-2);
    let year = dateObj.getFullYear();
    let orderDate = date + '/' + month + '/' + year;


    let data = {
        name: req.body.name,
        phone: req.body.phone,
        address: req.body.address,
        note: req.body.note,
        items: req.body.items,
        sub_total: parseInt(req.body.sub_total),
        discount: parseInt(req.body.discount),
        total: parseInt(req.body.total),
        payment_type: req.body.payment_type,
        ref: generateRandom(6),
        orderDate: orderDate,
        status: "pending",
    }




    db.collection('orders').add(data).then((success) => {

        console.log('TEMP POINTS:', temp_points);
        console.log('CUSTOMER: ', customer[user_id]);

        //get 10% from sub total and add to remaining points;
        let newpoints = temp_points + data.sub_total * 0.1;

        let update_data = { points: newpoints };

        console.log('update_data: ', update_data);

        db.collection('users').doc(user_id).update(update_data).then((success) => {
            console.log('POINT UPDATE:');
            let text = "Thank you. Order ကိုအတည်ပြုပြီးပါပြီ."+ "\u000A";
            text += " မှာယူပြီး မိနစ်သုံးဆယ်အတွင်းရပါမည် "+ "\u000A";
            text += "Your booking reference number is: " + data.ref;
            let response = { "text": text };
            callSend(user_id, response);

        }).catch((err) => {
            console.log('Error', err);
        });
    }).catch((err) => {
        console.log('Error', err);
    });
});


//Set up Get Started Button. To run one time
//eg https://fbstarter.herokuapp.com/setgsbutton
app.get('/setgsbutton', function(req, res) {
    setupGetStartedButton(res);
});

//Set up Persistent Menu. To run one time
//eg https://fbstarter.herokuapp.com/setpersistentmenu
app.get('/setpersistentmenu', function(req, res) {
    setupPersistentMenu(res);
});

//Remove Get Started and Persistent Menu. To run one time
//eg https://fbstarter.herokuapp.com/clear
app.get('/clear', function(req, res) {
    removePersistentMenu(res);
});

//whitelist domains
//eg https://fbstarter.herokuapp.com/whitelists
app.get('/whitelists', function(req, res) {
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
Function to Handle when user send quick reply message
***********************************************/

function handleQuickReply(sender_psid, received_message) {

    console.log('QUICK REPLY', received_message);

    received_message = received_message.toLowerCase();

    switch (received_message) {
        case "register":
            current_question = "q1";
            botQuestions(current_question, sender_psid);
            break;
        case "check-order":
            current_question = "q4";
            botQuestions(current_question, sender_psid);
            break;
        case "all-fd":
            shopMenu(sender_psid);
            break;
        case "menu-list":
            showMenuList(sender_psid);
            break;
        case "breakfast-food":
            showBreakfastFood(sender_psid);
            break;
        case "lunch-food":
            showLunchFood(sender_psid);
            break;
        case "chinese-food":
            showChineseFood(sender_psid);
            break;
        case "juice":
            showJuice(sender_psid);
            break;
        case "confirm-register":
            saveRegistration(userInputs[user_id], sender_psid);
            break;

        default:
            defaultReply(sender_psid);
    }

}

/**********************************************
Function to Handle when user send text message
***********************************************/

const handleMessage = (sender_psid, received_message) => {

    console.log('TEXT REPLY', received_message);

    let response;

    if (received_message.attachments) {
        handleAttachments(sender_psid, received_message.attachments);
    } else if (current_question == 'q1') {
        userInputs[user_id].name = received_message.text;
        current_question = 'q2';
        botQuestions(current_question, sender_psid);
    } else if (current_question == 'q2') {
        userInputs[user_id].phone = received_message.text;
        current_question = 'q3';
        botQuestions(current_question, sender_psid);
    } else if (current_question == 'q3') {
        userInputs[user_id].address = received_message.text;
        current_question = '';
        confirmRegister(sender_psid);
    } else if (current_question == 'q4') {
        let order_ref = received_message.text;

        console.log('order_ref: ', order_ref);
        current_question = '';
        showOrder(sender_psid, order_ref);
    } else {

        let user_message = received_message.text;

        user_message = user_message.toLowerCase();

        switch (user_message) {
            case "hi":
            startGreeting(sender_psid);
            break;
            case "start":
                startGreeting(sender_psid);
                break;
            case "menu":
                showMenuList(sender_psid);
                break;
            case "check-order":
                current_question = "q4";
                botQuestions(current_question, sender_psid);
                break;
            default:
                defaultReply(sender_psid);
        }


    }

}



/*********************************************
Function to handle when user click button
**********************************************/
const handlePostback = (sender_psid, received_postback) => {



    let payload = received_postback.payload;

    console.log('BUTTON PAYLOAD', payload);

    switch (payload) {
        case "get_started":
            startGreeting(sender_psid);
            break;
        case "no":
            showButtonReplyNo(sender_psid);
            break;
        default:
            defaultReply(sender_psid);
    }
}


const generateRandom = (length) => {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}



/**************
startshop
**************/
const botQuestions = (current_question, sender_psid) => {
    if (current_question == 'q1') {
        let response = { "text": bot_questions.q1 };
        callSend(sender_psid, response);
    } else if (current_question == 'q2') {
        let response = { "text": bot_questions.q2 };
        callSend(sender_psid, response);
    } else if (current_question == 'q3') {
        let response = { "text": bot_questions.q3 };
        callSend(sender_psid, response);
    } else if (current_question == 'q4') {
        let response = { "text": bot_questions.q4 };
        callSend(sender_psid, response);
    }
}

const startGreeting = (sender_psid) => {
    let response = { "text": "မင်္ဂလာပါ သိန်းရာဇာ စားသောက်ဆိုင်မှကြိုဆိုပါတယ်" };
    callSend(sender_psid, response).then(() => {
        showMenu(sender_psid);
    });
}

const showMenu = async (sender_psid) => {
    let title = "";
    const userRef = db.collection('users').doc(sender_psid);
    const user = await userRef.get();
    if (!user.exists) {
        title = "Register";
        first_reg = true;
    } else {
        title = "Update Profile";
        first_reg = false;
    }


    let response = {
        "text": "Select your reply",
        "quick_replies": [{
                "content_type": "text",
                "title": title,
                "payload": "register",
                "image_url":"https://i.imgur.com/4M4LQ6x.jpg"
            }, 
            {
                "content_type": "text",
                "title": "All Foods and Drinks",
                "payload": "all-fd",
                "image_url":"https://i.imgur.com/ntip7Ic.png"
            },
            {
                "content_type": "text",
                "title": "Menu List",
                "payload": "menu-list",
                "image_url":"https://i.imgur.com/t3dDjS9.png"
            },
            {
                "content_type": "text",
                "title": "My Order",
                "payload": "check-order",
                "image_url":"https://i.imgur.com/QYeFrSK.png"
            }

        ]
    };
    callSend(sender_psid, response);
}



const confirmRegister = (sender_psid) => {

    let summery = "";
    summery += "name:" + userInputs[user_id].name + "\u000A";
    summery += "phone:" + userInputs[user_id].phone + "\u000A";
    summery += "address:" + userInputs[user_id].address + "\u000A";

    let response1 = { "text": summery };

    let response2 = {
        "text": "Confirm to register",
        "quick_replies": [{
            "content_type": "text",
            "title": "Confirm",
            "payload": "confirm-register",
        }, {
            "content_type": "text",
            "title": "Cancel",
            "payload": "off",
        }]
    };

    callSend(sender_psid, response1).then(() => {
        return callSend(sender_psid, response2);
    });
}

const saveRegistration = (arg, sender_psid) => {

    let data = arg;

    if (first_reg) {
        let today = new Date();
        data.fid = sender_psid;
        data.created_on = today;
        data.points = 50;
        data.status = "pending";


        db.collection('users').doc(sender_psid).set(data).then((success) => {
            console.log('SAVED', success);
            //first_reg = false;
            let text = "Thank you. You have been registered." + "\u000A";
            let response = { "text": text };
            callSend(sender_psid, response);
        }).catch((err) => {
            console.log('Error', err);
        });

    } else {
        let update_data = { name: data.name, phone: data.phone, address: data.address };
        db.collection('users').doc(sender_psid).update(update_data).then((success) => {
            console.log('SAVED', success);
            //first_reg = false;
            let text = "Thank you. You have been registered." + "\u000A";
            let response = { "text": text };
            callSend(sender_psid, response);
        }).catch((err) => {
            console.log('Error', err);
        });

    }
}

const showOrder = async (sender_psid, order_ref) => {

    let cust_points = 0;

    const ordersRef = db.collection('orders').where("ref", "==", order_ref).limit(1);
    const snapshot = await ordersRef.get();

    const userRef = db.collection('users').doc(user_id);
    const user = await userRef.get();
    if (!user.exists) {
        cust_points = 0;
    } else {
        cust_points = user.data().points;
    }


    if (snapshot.empty) {
        let response = { "text": "Incorrect order number" };
        callSend(sender_psid, response).then(() => {
            return startGreeting(sender_psid);
        });
    } else {
        let order = {}

        snapshot.forEach(doc => {
            order.ref = doc.data().ref;
            order.status = doc.data().status;
            order.items = doc.data().items;
            order.total = doc.data().total;
        });


        let response1 = { "text": `Your order ${order.ref} is ${order.status}.` };
        let response2 = { "text": `Order Summery: ${order.items}.` };
        let response3 = { "text": `Total Price: ${order.total} Ks` };
        let response4 = { "text": `You have remaining ${cust_points} point(s)` };
        callSend(sender_psid, response1).then(() => {
            return callSend(sender_psid, response2).then(() => {
                return callSend(sender_psid, response3).then(() => {
                    return callSend(sender_psid, response4)
                });
            });
        });

    }

}


const shopMenu = (sender_psid) => {
    let response = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "All Foods and Drinks",
                    "image_url": "https://i.imgur.com/ntip7Ic.png",
                    "buttons": [{
                            "type": "web_url",
                            "title": "View",
                            "url": APP_URL + "shop/",
                            "webview_height_ratio": "full",
                            "messenger_extensions": true,
                        },

                    ],
                }]
            }
        }
    }
    callSend(sender_psid, response);
}

// START MENULIST
const showMenuList = (sender_psid) => {
    let response = {
        "text": "Order By Category",
        "quick_replies": [{
            "content_type": "text",
            "title": "Breakfast Food",
            "payload": "breakfast-food",
            "image_url":"https://i.imgur.com/IBn8L5w.png"
        }, {
            "content_type": "text",
            "title": "Lunch Food",
            "payload": "lunch-food",
            "image_url":"https://i.imgur.com/4CgknJW.png"
        }, {
            "content_type": "text",
            "title": "Chinese Food",
            "payload": "chinese-food",
            "image_url":"https://i.imgur.com/fCYPlIW.png"
        }, {
            "content_type": "text",
            "title": "Juice",
            "payload": "juice",
            "image_url":"https://i.imgur.com/clhBWtd.png"
        }]
    };
    callSend(sender_psid, response);
}
// END MENULIST

// START BREAKFASTFOOD
const showBreakfastFood = (sender_psid) => {
    let response = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "Breakfast Food",
                    "image_url": "https://i.imgur.com/g56xn3n.jpg",
                    "buttons": [{
                            "type": "web_url",
                            "title": "View",
                            "url": APP_URL + "breakfast_food/",
                            "webview_height_ratio": "full",
                            "messenger_extensions": true,
                        },

                    ],
                }]
            }
        }
    }
    callSend(sender_psid, response);
}
// END BREAKFASTFOOD

// START LUNCHFOOD
const showLunchFood = (sender_psid) => {
    let response = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "Lunch Food",
                    "image_url": "https://i.imgur.com/4CgknJW.png",
                    "buttons": [{
                            "type": "web_url",
                            "title": "View",
                            "url": APP_URL + "lunch_food/",
                            "webview_height_ratio": "full",
                            "messenger_extensions": true,
                        },

                    ],
                }]
            }
        }
    }
    callSend(sender_psid, response);
}
// END LUNCHFOOD

// START CHINESE FOOD
const showChineseFood = (sender_psid) => {
    let response = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "Chinese Food",
                    "image_url": "https://i.imgur.com/XyYl1DF.jpg",
                    "buttons": [{
                            "type": "web_url",
                            "title": "View",
                            "url": APP_URL + "chinese_food/",
                            "webview_height_ratio": "full",
                            "messenger_extensions": true,
                        },

                    ],
                }]
            }
        }
    }
    callSend(sender_psid, response);
}
// END CHINESE FOOD

// START JUICE
const showJuice = (sender_psid) => {
    let response = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "generic",
                "elements": [{
                    "title": "Juice",
                    "image_url": "https://i.imgur.com/jDddJzk.jpg",
                    "buttons": [{
                            "type": "web_url",
                            "title": "View",
                            "url": APP_URL + "juice/",
                            "webview_height_ratio": "full",
                            "messenger_extensions": true,
                        },

                    ],
                }]
            }
        }
    }
    callSend(sender_psid, response);
}
// END JUICE


/**************
endshop
**************/


const showButtonReplyYes = (sender_psid) => {
    let response = { "text": "You clicked YES" };
    callSend(sender_psid, response);
}

const showButtonReplyNo = (sender_psid) => {
    let response = { "text": "You clicked NO" };
    callSend(sender_psid, response);
}


const defaultReply = (sender_psid) => {
    let response1 = { "text": "To check order, please type 'check-order'" };
    let response2 = { "text": "To start bot, please type 'start'" };
    callSend(sender_psid, response1).then(() => {
        return callSend(sender_psid, response2);
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
            "uri": "https://graph.facebook.com/v6.0/me/messages",
            "qs": { "access_token": PAGE_ACCESS_TOKEN },
            "method": "POST",
            "json": request_body
        }, (err, res, body) => {
            if (!err) {
                //console.log('RES', res);
                //console.log('BODY', body);
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


const uploadImageToStorage = (file) => {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject('No image file');
        }
        let newFileName = `${Date.now()}_${file.originalname}`;

        let fileUpload = bucket.file(newFileName);

        const blobStream = fileUpload.createWriteStream({
            metadata: {
                contentType: file.mimetype,
                metadata: {
                    firebaseStorageDownloadTokens: uuidv4
                }
            }
        });

        blobStream.on('error', (error) => {
            console.log('BLOB:', error);
            reject('Something is wrong! Unable to upload at the moment.');
        });

        blobStream.on('finish', () => {
            // The public URL can be used to directly access the file via HTTP.
            //const url = format(`https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`);
            const url = format(`https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${fileUpload.name}?alt=media&token=${uuidv4}`);
            console.log("image url:", url);
            resolve(url);
        });

        blobStream.end(file.buffer);
    });
}




/*************************************
FUNCTION TO SET UP GET STARTED BUTTON
**************************************/

const setupGetStartedButton = (res) => {
    let messageData = { "get_started": { "payload": "get_started" } };

    request({
            url: 'https://graph.facebook.com/v2.6/me/messenger_profile?access_token=' + PAGE_ACCESS_TOKEN,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            form: messageData
        },
        function(error, response, body) {
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
                        "type": "postback",
                        "title": "View My Tasks",
                        "payload": "view-tasks"
                    },
                    {
                        "type": "postback",
                        "title": "Add New Task",
                        "payload": "add-task"
                    },
                    {
                        "type": "postback",
                        "title": "Cancel",
                        "payload": "cancel"
                    }
                ]
            },
            {
                "locale": "default",
                "composer_input_disabled": false
            }
        ]
    };

    request({
            url: 'https://graph.facebook.com/v2.6/me/messenger_profile?access_token=' + PAGE_ACCESS_TOKEN,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            form: messageData
        },
        function(error, response, body) {
            if (!error && response.statusCode == 200) {
                res.send(body);
            } else {
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
            headers: { 'Content-Type': 'application/json' },
            form: messageData
        },
        function(error, response, body) {
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
            APP_URL,
            "https://herokuapp.com",
        ]
    };
    request({
            url: 'https://graph.facebook.com/v2.6/me/messenger_profile?access_token=' + PAGE_ACCESS_TOKEN,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            form: messageData
        },
        function(error, response, body) {
            if (!error && response.statusCode == 200) {
                res.send(body);
            } else {
                res.send(body);
            }
        });
}