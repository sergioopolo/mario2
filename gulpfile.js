//paths for source and bundled parts of app
var basePaths = {
    src:    'src/',
    dest:   'assets/',
    npm:    'node_modules/',
    vendor: 'vendor'
};

//require plugins
var gulp = require('gulp');

var es          = require('event-stream'),
    gutil       = require('gulp-util'),
    bourbon     = require('node-bourbon'),
    path        = require('relative-path'),
    runSequence = require('run-sequence'),
    del         = require('del');

//plugins - load gulp-* plugins without direct calls
var plugins = require("gulp-load-plugins")({
    pattern: ['gulp-*', 'gulp.*'],
    replaceString: /\bgulp[\-.]/
});

//env - call gulp --prod to go into production mode
var sassStyle = 'expanded'; // SASS syntax
var sourceMap = true; //wheter to build source maps
var isProduction = false; //mode flag

if(gutil.env.prod === true) {
    isProduction = true;
    sassStyle = 'compressed';
    sourceMap = false;
}

//log
var changeEvent = function(evt) {
    gutil.log('File', gutil.colors.cyan(evt.path.replace(new RegExp('/.*(?=/' + basePaths.src + ')/'), '')), 'was', gutil.colors.magenta(evt.type));
};

//js
gulp.task('build-js', function() {
    var vendorFiles = [basePaths.src+'lib/*.js'],
        appFiles = [basePaths.src+'js/*.js']; //our own JS files

    return gulp.src(vendorFiles.concat(appFiles)) //join them
        .pipe(plugins.filter('*.js'))//select only .js ones
        .pipe(plugins.concat('bundle.js'))//combine them into bundle.js
        .pipe(isProduction ? plugins.uglify() : gutil.noop()) //minification
        .pipe(plugins.size()) //print size for log
        .on('error', console.log) //log
        .pipe(gulp.dest(basePaths.dest+'js')) //write results into file
});

gulp.task('build-css', function() {
    var vendorFiles = [],
        appFiles = [basePaths.src+'css/*.css']; //our own JS files

    return gulp.src(vendorFiles.concat(appFiles)) //join them
        .pipe(plugins.concat('bundle.css')) //combine into file
        .pipe(isProduction ? plugins.cssmin() : gutil.noop()) //minification on production
        .pipe(plugins.size()) //display size
        .pipe(gulp.dest(basePaths.dest+'css')) //write file
        .on('error', console.log); //log
});



//watchers
gulp.task('watch', function(){
    gulp.watch([basePaths.src+'css/*.css', ['build-css']).on('change', function(evt) {
        changeEvent(evt);
    });
    gulp.watch(basePaths.src+'js/*.js', ['build-js']).on('change', function(evt) {
        changeEvent(evt);
    });
});


//default
gulp.task('default', ['build-js', 'build-css', 'watch']);

