var express = require('express');
var router = express.Router();
var passport = require('passport');
var bcrypt = require('bcryptjs');

// Get Users model
var User = require('../models/user');

/*
 * 
NHẬN đăng ký
 */
router.get('/register', function (req, res) {

    res.render('register', {            //đi đến trang register
        title: 'Đăng kí'                //tên trang trong view/register
    });

});

/*
 * POST đăng ký
 */
router.post('/register', function (req, res) {

    //lấy post từ view/register
    var name = req.body.name;                                                
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;

    //thông báo lỗi 
    req.checkBody('name', 'Tên là bắt buộc!').notEmpty();
    req.checkBody('email', 'Email không được trống!').isEmail();
    req.checkBody('username', 'Tên người dùng là bắt buộc!').notEmpty();
    req.checkBody('password', 'Cần có mật khẩu!').notEmpty();
    req.checkBody('password2', 'Mật khẩu không phù hợp!').equals(password);

    var errors = req.validationErrors(); //Validator middleware


    //nếu lỗi thì về trang register
    if (errors) { 
        res.render('register', {        
            errors: errors,
            user: null,
            title: 'Register' 
        });

    //kiểm tra tên người dùng tồn tại hay chưa
    } else { 
        User.findOne({username: username}, function (err, user) {
            if (err)
                console.log(err);

            if (user) {
                req.flash('danger', 'Tên người dùng đã tồn tại, hãy chọn tên khác!');
                res.redirect('/users/register');
            } else {
                //nhận vào database
                var user = new User({
                    name: name,
                    email: email,
                    username: username,
                    password: password,
                    admin: 0
                });
                //Tạo mối không đồng bộ.
                //Số vòng sử dụng, mặc định là 10 nếu bỏ qua
                bcrypt.genSalt(10, function (err, salt) {
                    //Tạo hàm băm không đồng bộ cho chuỗi đã cho.
                    bcrypt.hash(user.password, salt, function (err, hash) { 
                        if (err)
                            console.log(err);

                        user.password = hash;
                        //lưu vào database
                        user.save(function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                req.flash('success', 'You are now registered!');
                                res.redirect('/users/login')
                            }
                        });
                    });
                });
            }
        });
    }

});

/*
 * Lấy trang login
 */
router.get('/login', function (req, res) {

    if (res.locals.user) res.redirect('/');
    
    res.render('login', {
        title: 'Log in'
    });

});

/*
 * POST login 
 */
router.post('/login', function (req, res, next) {
    //Xác thực các yêu cầu.
    passport.authenticate('local', {
        //Sau khi đăng nhập thành công, chuyển hướng đến URL đã cho.
        successRedirect: '/',
        failureRedirect: '/users/login',
        //Đúng với thông báo lỗi flash hoặc một chuỗi để sử dụng làm thông báo flash cho các lỗi (ghi đè bất kỳ thông báo nào từ chính chiến lược).
        failureFlash: true
    })(req, res, next);
    
});

/*
 * GET log out
 */
router.get('/logout', function (req, res) {

    req.logout();
    
    req.flash('success', 'Bạn đã đăng xuất!');
    res.redirect('/users/login');

});

// Exports
module.exports = router;


