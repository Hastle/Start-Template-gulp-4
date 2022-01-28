const { src, dest, parallel, series, watch } = require('gulp');
const browserSync = require('browser-sync').create();
const concat = require('gulp-concat');
const uglify = require('gulp-uglify-es').default;
const sass = require('gulp-sass')(require('sass'));
const cssnano = require('gulp-cssnano');
const autoprefixer = require('gulp-autoprefixer');
const cleancss = require('gulp-clean-css');
const rename = require('gulp-rename');
const imagemin = require('gulp-imagemin');
const imageminJpegRecompress = require('imagemin-jpeg-recompress');
const pngquant = require('imagemin-pngquant');
const del = require('del');

// Определяем логику работы Browsersync
function browsersync() {
	browserSync.init({ // Инициализация Browsersync
		server: { baseDir: 'app/' }, // Указываем папку сервера
		notify: false, // Отключаем уведомления
		online: true // Режим работы: true или false
	})
}

function sassCompile() {
	return src('app/sass/**/*.+(sass|scss)')
	.pipe(sass().on('error', sass.logError))
	.pipe(autoprefixer(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true }))
	.pipe(gulp.dest('app/css'))
	.pipe(browserSync.reload({stream: true}))
}

function cssLibs() {
	return src('app/css/libs.css') 
	.pipe(cssnano()) 
	.pipe(rename({suffix: '.min'})) 
	.pipe(dest('app/css')); 
}

function cssMinify() {
	return gulp.src([
		'app/css/*.css',
		'!app/css/media.css',
		'!app/css/animate.css',
		'!app/css/libs.css',
		])
	.pipe(cssnano())
	.pipe(dest('dist/css'));
}

var jsfiles = [
'app/libs/jquery/jquery-1.11.1.min.js',
'app/libs/parallax/parallax.min.js',
'app/libs/magnific-popup/magnific-popup.min.js',
'app/libs/scroll2id/pagescroll2id.min.js',
'app/libs/wow/wow.min.js',
'app/libs/fancybox/fancybox.min.js'
];

function scripts() {
	return src(jsfiles, {base: 'app/libs'})
	.pipe(concat('libs.min.js')) // Конкатенируем в один файл
	.pipe(uglify()) // Сжимаем JavaScript
	.pipe(dest('app/js/')) // Выгружаем готовый файл в папку назначения
	.pipe(browserSync.stream()) // Триггерим Browsersync для обновления страницы
}

function img() {
	return src('app/img/**/*')
	.pipe(cache(imagemin([
		imagemin.gifsicle({interlaced: true}),
		imagemin.jpegtran({progressive: true}),
		imageminJpegRecompress({
			loops: 5,
			min: 65,
			max: 70,
			quality:'medium'
		}),
		imagemin.svgo(),
		imagemin.optipng({optimizationLevel: 3}),
		pngquant({quality: '65-70', speed: 5})
		],{
			verbose: true
		})))
	.pipe(dest('dist/img'));
}

function build() {
	var buildCss = src([
		'app/css/*',
		'!app/css/libs.css',
		'!app/css/animate.css'
		])
	.pipe(dest('dist/css'))
	
	var buildFonts = src('app/fonts/**/*')
	.pipe(dest('dist/fonts'))

	var buildJs = src('app/js/**/*')
	.pipe(dest('dist/js'))

	var buildOther = src('app/*.php')
	.pipe(dest('dist'))

	var buildHtaccess = src('app/.htaccess')
	.pipe(dest('dist'))

	var buildHtml = src('app/**/*.html')
	.pipe(dest('dist'));
}

function clean() {
	return del('dist', { force: true }) // Удаляем всё содержимое папки "dist/"
}

function watchAll() {
	watch('app/sass/**/*.sass', sassCompile);
	watch('app/**/*.html', browserSync.reload);
	watch('app/css/*.css', browserSync.reload);
	watch('app/js/**/*.js', browserSync.reload);
	watch('app/libs/**/*.js', browserSync.reload);
	watch('app/img/**/*.*', browserSync.reload);
}

// Экспортируем функцию browsersync() как таск browsersync. Значение после знака = это имеющаяся функция.
exports.browsersync = browsersync;

// Экспортируем функцию scripts() в таск scripts
exports.scripts = scripts;

// Экспортируем функцию sass() в таск sass
exports.sass = sassCompile;

// Экспорт функции img() в таск img
exports.img = img;

// Создаём новый таск "build", который последовательно выполняет нужные операции
exports.build = series(clean, sass, cssMinify, scripts, img, build);

// Экспортируем дефолтный таск с нужным набором функций
exports.default = parallel(sass, cssLibs, scripts, browsersync, watchAll);
