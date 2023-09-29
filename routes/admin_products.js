var express = require('express');
var router = express.Router();
var mkdirp = require('mkdirp');
var fs = require('fs-extra');
var resizeImg = require('resize-img');


// Nhận mẫu sản phẩm
var Product = require('../models/product');

// Nhận mô hình Danh mục
var Category = require('../models/category');

/*
 * GET products index
 */
router.get('/',  function (req, res) {
    var count;

    Product.count(function (err, c) {
        count = c;
    });

    //đi đến view/products
    Product.find(function (err, products) {
        res.render('admin/products', {
            products: products,
            count: count
        });
    });
});

/*
 * GET sản phẩm
 */
router.get('/add-product',  function (req, res) {

    //đang = rỗng
    var title = "";
    var desc = "";
    var price = "";

    //nhận từ add_product
    Category.find(function (err, categories) {
        res.render('admin/add_product', {
            title: title,
            desc: desc,
            categories: categories,
            price: price
        });
    });


});

/*
 * Thêm sản phẩm
 */
router.post('/add-product', function (req, res) {

    var imageFile = typeof req.files.image !== "undefined" ? req.files.image.name : "";

    //báo lỗi
    req.checkBody('title','Tiêu đề phải có giá trị.').notEmpty();
    req.checkBody('desc', 'Mô tả phải có giá trị.').notEmpty();
    req.checkBody('price', 'Giá phải có giá trị.').isDecimal();
    req.checkBody('image', 'Bạn phải tải lên một hình ảnh').isImage(imageFile);

    //post từ view/admin/add_product
    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();
    var desc = req.body.desc;
    var price = req.body.price;
    var category = req.body.category;

    var errors = req.validationErrors();

    //kiểm tra nếu lỗi thì về trang admin/add_product
    if (errors) {
        Category.find(function (err, categories) {
            res.render('admin/add_product', {
                errors: errors,
                title: title,
                desc: desc,
                categories: categories,
                price: price
            });
        });
    } else {
        //kiểm tra tiều đề đã tồn tại hay chưa
        Product.findOne({slug: slug}, function (err, product) {
            if (product) {
                req.flash('danger', 'Tiêu đề sản phẩm tồn tại, chọn khác.');
                Category.find(function (err, categories) {
                    res.render('admin/add_product', {
                        title: title,
                        desc: desc,
                        categories: categories,
                        price: price
                    });
                });
            } else {
                //xác nhập database
                var price2 = parseFloat(price).toFixed(3);

                var product = new Product({
                    title: title,
                    slug: slug,
                    desc: desc,
                    price: price2,
                    category: category,
                    image: imageFile
                });

                //lưu
                product.save(function (err) {
                    if (err)
                        return console.log(err);

                    mkdirp('public/product_images/' + product._id, function (err) {
                        return console.log(err);
                    });

                    mkdirp('public/product_images/' + product._id + '/gallery', function (err) {
                        return console.log(err);
                    });

                    mkdirp('public/product_images/' + product._id + '/gallery/thumbs', function (err) {
                        return console.log(err);
                    });

                    if (imageFile != "") {
                        var productImage = req.files.image;
                        var path = 'public/product_images/' + product._id + '/' + imageFile;

                        productImage.mv(path, function (err) {
                            return console.log(err);
                        });
                    }

                    req.flash('success', 'Đã thêm sản phẩm!');
                    res.redirect('/admin/products');
                });
            }
        });
    }

});

/*
 * GET chỉnh sửa sản phẩm
 */
router.get('/edit-product/:id', function (req, res) {

    var errors;

    if (req.session.errors)
        errors = req.session.errors;
    req.session.errors = null;

    Category.find(function (err, categories) {

        Product.findById(req.params.id, function (err, p) {
            if (err) {
                console.log(err);
                res.redirect('/admin/products');
            } else {
                var galleryDir = 'public/product_images/' + p._id + '/gallery';
                var galleryImages = null;

                fs.readdir(galleryDir, function (err, files) {
                    if (err) {
                        console.log(err);
                    } else {
                        galleryImages = files;

                        res.render('admin/edit_product', {
                            title: p.title,
                            errors: errors,
                            desc: p.desc,
                            categories: categories,
                            category: p.category.replace(/\s+/g, '-').toLowerCase(),
                            price: parseFloat(p.price).toFixed(2),
                            image: p.image,
                            galleryImages: galleryImages,
                            id: p._id
                        });
                    }
                });
            }
        });

    });

});

/*
 * POST chỉnh sửa sản phẩm
 */
router.post('/edit-product/:id', function (req, res) {

    var imageFile = typeof req.files.image !== "undefined" ? req.files.image.name : "";

    req.checkBody('title', 'Tiêu đề phải có giá trị.').notEmpty();
    req.checkBody('desc', 'Mô tả phải có giá trị.').notEmpty();
    req.checkBody('price', 'Giá phải có giá trị.').isDecimal();
    req.checkBody('image', 'Bạn phải tải lên một hình ảnh').isImage(imageFile);

    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();
    var desc = req.body.desc;
    var price = req.body.price;
    var category = req.body.category;
    var pimage = req.body.pimage;
    var id = req.params.id;

    var errors = req.validationErrors();

    if (errors) {
        req.session.errors = errors;
        res.redirect('/admin/products/edit-product/' + id);
    } else {
        Product.findOne({slug: slug, _id: {'$ne': id}}, function (err, p) {
            if (err)
                console.log(err);

            if (p) {
                req.flash('danger', 'Tiêu đề sản phẩm tồn tại, chọn khác.');
                res.redirect('/admin/products/edit-product/' + id);
            } else {
                Product.findById(id, function (err, p) {
                    if (err)
                        console.log(err);

                    p.title = title;
                    p.slug = slug;
                    p.desc = desc;
                    p.price = parseFloat(price).toFixed(2);
                    p.category = category;
                    if (imageFile != "") {
                        p.image = imageFile;
                    }

                    p.save(function (err) {
                        if (err)
                            console.log(err);

                        if (imageFile != "") {
                            if (pimage != "") {
                                fs.remove('public/product_images/' + id + '/' + pimage, function (err) {
                                    if (err)
                                        console.log(err);
                                });
                            }

                            var productImage = req.files.image;
                            var path = 'public/product_images/' + id + '/' + imageFile;

                            productImage.mv(path, function (err) {
                                return console.log(err);
                            });

                        }

                        req.flash('success', 'Sản phẩm đã được chỉnh sửa!');
                        res.redirect('/admin/products');
                    });

                });
            }
        });
    }

});

/*
 * POST thư viện sản phẩm [ảnh trưng bày]
 */ 
router.post('/product-gallery/:id', function (req, res) {

    var productImage = req.files.file;
    var id = req.params.id;
    var path = 'public/product_images/' + id + '/gallery/' + req.files.file.name;
    var thumbsPath = 'public/product_images/' + id + '/gallery/thumbs/' + req.files.file.name;

    productImage.mv(path, function (err) {
        if (err)
            console.log(err);

        resizeImg(fs.readFileSync(path), {width: 100, height: 100}).then(function (buf) {
            fs.writeFileSync(thumbsPath, buf);
        });
    });

    res.sendStatus(200);

});

/*
 * GET xóa ảnh
 */
router.get('/delete-image/:image',  function (req, res) {

    var originalImage = 'public/product_images/' + req.query.id + '/gallery/' + req.params.image;
    var thumbImage = 'public/product_images/' + req.query.id + '/gallery/thumbs/' + req.params.image;

    fs.remove(originalImage, function (err) {
        if (err) {
            console.log(err);
        } else {
            fs.remove(thumbImage, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    req.flash('success', 'Đã xóa hình ảnh!');
                    res.redirect('/admin/products/edit-product/' + req.query.id);
                }
            });
        }
    });
});

/*
 * GET delete product
 */
router.get('/delete-product/:id', function (req, res) {

    var id = req.params.id;
    var path = 'public/product_images/' + id;

    fs.remove(path, function (err) {
        if (err) {
            console.log(err);
        } else {
            Product.findByIdAndRemove(id, function (err) {
                console.log(err);
            });
            
            req.flash('success', 'Sản phẩm đã bị xóa!');
            res.redirect('/admin/products');
        }
    });

});

// Exports
module.exports = router;


