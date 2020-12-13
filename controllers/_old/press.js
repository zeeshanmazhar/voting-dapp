const express = require('express');
const router = express.Router();
var multer  = require('multer');

let Press = require('../models/press');

var storage =   multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null,  __dirname.replace('controllers', '') + 'public/uploads/');
    },
    filename: function (req, file, callback) {
      console.log(file);
      
      var ext = file.mimetype.split('/')[1];
      callback(null, 'post' + '-' + Date.now() +'.'+ ext);
    } 
  });
  var upload = multer({ storage : storage}).single('picture');
  

router.get('/admin/press/posts', adminAuth, function(req, res){

  Press.find({}).then(function(posts){
        res.render('admin/all_posts',{
          user: req.user,
          posts:posts,
        });  
      
  }).catch(function(err) {
    console.log(err);
  });  

});

router.get('/admin/post/:id', adminAuth, function(req, res){

    Press.find({_id : req.params.id},function(err, posts){

        if (err) {            
            console.log(err);
            
        }else{
            console.log(posts);

          res.render('admin/edit_post',{
            user: req.user,
            post:posts[0],
          });  
        }
    });
  
  });
  
  router.post('/admin/post/image/:id',function(req,res){
    upload(req,res,function(err) {
        if(err) {
          console.log(err);
          }
          else{
            Press.updateOne({_id:req.params.id}, {image:req.file.filename}, function (err) {
              if (err) {
                console.log(err);
                return;
              } else {
                
              }
            });
            res.redirect('/admin/post/'+req.params.id);
        }
    });
});


router.get('/admin/press/add', adminAuth, function(req, res){

          res.render('admin/add_post',{
            user: req.user,
          });  

  });


router.post('/admin/press/add',adminAuth, function(req, res){

    const title = req.body.title;
    const details = req.body.details;
    const admin_id = req.user._id;
        
    req.checkBody('title', 'Title is required').notEmpty();
    req.checkBody('details', 'Post details are required').notEmpty();
    
    let errors = req.validationErrors();
        
    if(errors){
      
        console.log(errors);
      res.render('admin/add_post', {
        errors:errors,
        user:req.user
      });

    } else {
        
            let newPost = new Press({
                title:req.body.title,
                details:req.body.details,
                admin_id:admin_id
              });
          
                newPost.save(function(err, result){
                  if(err){
                    console.log(err);
                  } else {
                    
                    req.flash('success','Post is added.');
                    res.redirect('/admin/press/posts');
                  }
                });
    }
});
    


  router.post('/press/activate_post', function (req, res) {
  
    let editUser = {};
    editUser.status = 'active';
    
    let query = { _id: req.body.post_id };
    console.log(query);
    
    Press.updateOne(query, editUser, function (err) {
      if (err) {
        console.log(err);
        return;
      } else {
        res.send({ 'res': 'yes' });
      }
    }); 
  });
  
  router.post('/press/deactive_post', function (req, res) {
    
    let editUser = {};
    editUser.status = 'deactive';
  
    let query = { _id: req.body.post_id };
  
    Press.updateOne(query, editUser, function (err) {
      if (err) {
        console.log(err);
        return;
      } else {
        res.send({ 'res': 'yes' });
      }
    }); 
  });
  
  router.post('/press/delete_post', function (req, res) {
    
    Press.findByIdAndRemove(req.body.post_id , function (err) {
      if (err) {
        console.log(err);
        return;
      } else {
        Press.find({}).then(function(posts){
            res.render('admin/all_posts',{
              user: req.user,
              posts:posts,
            });  
          
      }).catch(function(err) {
        console.log(err);
      });  
    
      }
    }); 
  });
  


// Access Control
function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    return next();
  } else {
    req.flash('danger', 'Please login');
    res.redirect('/login');
  }
}

function userAuth(req, res, next) {
    
  if (req.isAuthenticated()) {
    return next();
  } else {
    req.flash('danger', 'Please login');
    res.redirect('/login');
  }
}

function adminAuth(req, res, next) {
    
  if (req.isAuthenticated()) {
       if (req.user.user_type != 'admin') {
         res.redirect('/dashboard');
      }
    return next();
  } else {
    req.flash('danger', 'Please login');
    res.redirect('/login');
  }
}



module.exports = router;



