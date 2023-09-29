var express = require('express');
var router = express.Router();


// Get Category model
var Category = require('../models/category');

/*
 * GET trang doanh mục view/admin/categories
 */
router.get('/', function (req, res) {
    Category.find(function (err, categories) {
        if (err)
            return console.log(err);
        res.render('admin/categories', {
            categories: categories
        });
    });
});

/*
 * GET thêm thể loại
 */
router.get('/add-category', function (req, res) {

    var title = "";

    res.render('admin/add_category', {
        title: title
    });

});

/*
 * POST thêm thể loại
 */
router.post('/add-category', function (req, res) {
    //báo lỗi
    req.checkBody('title', 'Tiêu đề phải có giá trị.').notEmpty();
    
    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();

    var errors = req.validationErrors();

    if (errors) {
        //nếu lỗi thì về  admin/add_category
        res.render('admin/add_category', {
            errors: errors,
            title: title
        });
    } else {
        //kiểm tra tồn tại hay chưa
        Category.findOne({slug: slug}, function (err, category) {
            if (category) {
                req.flash('danger', 'Tiêu đề danh mục đã tồn tại, hãy chọn danh mục khác.');
                res.render('admin/add_category', {
                    title: title
                });
            } else {
                //lưu vào database
                var category = new Category({
                    title: title,
                    slug: slug
                });

                category.save(function (err) {
                    if (err)
                        return console.log(err);

                    Category.find(function (err, categories) {
                        if (err) {
                            console.log(err);
                        } else {
                            req.app.locals.categories = categories;
                        }
                    });

                    req.flash('success', 'Đã thêm danh mục!');
                    res.redirect('/admin/categories');
                });
            }
        });
    }

});

/*
 * GET chỉnh sửa danh mục
 */
router.get('/edit-category/:id',  function (req, res) {

    Category.findById(req.params.id, function (err, category) {
        if (err)
            return console.log(err);

        res.render('admin/edit_category', {
            title: category.title,
            id: category._id
        });
    });

});

/*
 * POST chỉnh sửa danh mục
 */
router.post('/edit-category/:id', function (req, res) {
    //báo lỗi
    req.checkBody('title', 'Tiêu đề phải có giá trị.').notEmpty();

    var title = req.body.title;
    var slug = title.replace(/\s+/g, '-').toLowerCase();
    var id = req.params.id;

    var errors = req.validationErrors();

    if (errors) {
        //nếu lỗi thì quay về admin/edit_category
        res.render('admin/edit_category', {
            errors: errors,
            title: title,
            id: id
        });
    } else {
        //kiểm tra đã tồn tại hay chưa
        Category.findOne({slug: slug, _id: {'$ne': id}}, function (err, category) {
            if (category) {
                req.flash('danger', 'Tiêu đề danh mục đã tồn tại, hãy chọn danh mục khác.');
                res.render('admin/edit_category', {
                    title: title,
                    id: id
                });
            } else {
                //in dữ liệu và lưu vào database
                Category.findById(id, function (err, category) {
                    if (err)
                        return console.log(err);

                    category.title = title;
                    category.slug = slug;

                    category.save(function (err) {
                        if (err)
                            return console.log(err);

                        Category.find(function (err, categories) {
                            if (err) {
                                console.log(err);
                            } else {
                                req.app.locals.categories = categories;
                            }
                        });

                        req.flash('success', 'Chuyên mục đã được chỉnh sửa!');
                        res.redirect('/admin/categories/edit-category/' + id);
                    });

                });
            }
        });
    }
});

/*
 * GET delete category
 */
router.get('/delete-category/:id',  function (req, res) {
    Category.findByIdAndRemove(req.params.id, function (err) {
        if (err)
            return console.log(err);

        Category.find(function (err, categories) {
            if (err) {
                console.log(err);
            } else {
                req.app.locals.categories = categories;
            }
        });

        req.flash('success', 'Đã xóa danh mục!');
        res.redirect('/admin/categories/');
    });
});


// Exports
module.exports = router;


