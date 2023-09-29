var express = require('express');
var router = express.Router();

// Nhận mẫu sản phẩm
var Product = require('../models/product');

/*
 *NHẬN thêm sản phẩm vào giỏ hàng
 */
router.get('/add/:product', function (req, res) {

    //lấy posrt từ product
    var slug = req.params.product;

    Product.findOne({slug: slug}, function (err, p) {
        if (err)
            console.log(err);

        if (typeof req.session.cart == "undefined") {
            //nếu bằng undefined thì giỏ rỗng
            req.session.cart = [];
            req.session.cart.push({
                title: slug,
                qty: 1,
                price: parseFloat(p.price).toFixed(3),
                image: '/product_images/' + p._id + '/' + p.image
            });
            //nếu có sản phẩm trong giỏ thì in ra
        } else {
            var cart = req.session.cart;
            var newItem = true;
            //vòng lặp +qty [cái sản phẩm 1 sp 2...]
            for (var i = 0; i < cart.length; i++) {
                if (cart[i].title == slug) {
                    cart[i].qty++;
                    newItem = false;
                    break;
                }
            }

            //in ra
            if (newItem) {
                cart.push({
                    title: slug,
                    qty: 1,
                    price: parseFloat(p.price).toFixed(3),
                    image: '/product_images/' + p._id + '/' + p.image
                });
            }
        }

//        console.log(req.session.cart);
        req.flash('success', 'Đã thêm sản phẩm!');
        res.redirect('back');
    });

});

/*
 *NHẬN trang thanh toán
 */
router.get('/checkout', function (req, res) {

    if (req.session.cart && req.session.cart.length == 0) {
        delete req.session.cart;
        res.redirect('/cart/checkout');
    } else {
        res.render('checkout', {
            title: 'Checkout',
            cart: req.session.cart
        });
    }

});

/*
 * NHẬN sản phẩm cập nhật
 */
router.get('/update/:product', function (req, res) {
    //nhận post từ product
    var slug = req.params.product;
    var cart = req.session.cart;
    var action = req.query.action;

    for (var i = 0; i < cart.length; i++) {
        if (cart[i].title == slug) {
            switch (action) {
                case "add": //thêm
                    cart[i].qty++; 
                    break;
                case "remove": //xóa
                    cart[i].qty--; 
                    if (cart[i].qty < 1)
                        cart.splice(i, 1);
                    break;
                case "clear": //xóa toàn bộ
                    cart.splice(i, 1);
                    if (cart.length == 0)
                        delete req.session.cart;
                    break;
                default:
                    console.log('Vấn đề cập nhật');
                    break;
            }
            break;
        }
    }

    req.flash('success', 'Đã cập nhật giỏ hàng!');
    res.redirect('/cart/checkout');

});

/*
 * Nhận xóa giỏ
 */
router.get('/clear', function (req, res) {

    delete req.session.cart;
    
    req.flash('success', 'Giỏ hàng đã được xóa!');
    res.redirect('/cart/checkout');

});

/*
 * GET buy now
 */
router.get('/buynow', function (req, res) {

    delete req.session.cart;
    
    res.sendStatus(200);

});

// Exports
module.exports = router;


