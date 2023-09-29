var express = require('express');
var router = express.Router();
var fs = require('fs-extra');


// lấy  Product model trong /models
var Product = require('../models/product');

// lấy Category /model
var Category = require('../models/category');

/*
 * lấy tất cả sản phẩm truyền vào file view/all_products
 */
router.get('/', function (req, res) {
//router.get('/', isUser, function (req, res) {

    Product.find(function (err, products) {
        if (err)
            console.log(err);

        res.render('all_products', {
            title: 'All products',
            products: products
        });
    });

});



/*
 *  NHẬN thông tin chi tiết sản phẩm
 */
router.get('/:category/:product', function (req, res) {

    var galleryImages = null;

    //Kiểm tra đăng nhập hay chưa
    var loggedIn = (req.isAuthenticated()) ? true : false;

    //in sản phẩm theo id
    Product.findOne({slug: req.params.product}, function (err, product) {
        if (err) {
            console.log(err);
        } else {
            var galleryDir = 'public/product_images/' + product._id + '/gallery'; //ảnh
            //đọc thư mục public/product_images
             fs.readdir(galleryDir, function (err, files) {
                if (err) {
                    console.log(err);
                } else {
                    galleryImages = files; //ảnh

                    //truyền vào view/product
                    res.render('product', {
                        title: product.title,
                        p: product,
                        galleryImages: galleryImages,
                        loggedIn: loggedIn
               
                    });
                }
            });
        }
    });

});

/*
 * NHẬN sản phẩm theo danh mục
 */
router.get('/:category', function (req, res) {

    var categorySlug = req.params.category;

    Category.findOne({slug: categorySlug}, function (err, c) {
        Product.find({category: categorySlug}, function (err, products) {
            if (err)
                console.log(err);

            res.render('cat_products', {
                title: c.title,
                products: products
            });
        });
    });

});


// Exports
module.exports = router;


