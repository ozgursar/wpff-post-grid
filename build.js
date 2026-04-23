import * as esbuild from 'esbuild';

const watch = process.argv.includes( '--watch' );

const targets = [
	{ in: 'assets/js/wpff-post-grid.js',          out: 'assets/js/wpff-post-grid.min.js' },
	{ in: 'blocks/wpff-post-grid/editor.js',       out: 'blocks/wpff-post-grid/editor.min.js' },
	{ in: 'assets/css/wpff-post-grid.css',         out: 'assets/css/wpff-post-grid.min.css' },
	{ in: 'assets/css/wpff-post-grid-editor.css',  out: 'assets/css/wpff-post-grid-editor.min.css' },
];

const configs = targets.map( ( t ) => ( {
	entryPoints: [ t.in ],
	outfile:     t.out,
	bundle:      false,
	minify:      true,
	logLevel:    'info',
} ) );

if ( watch ) {
	const ctxs = await Promise.all( configs.map( ( c ) => esbuild.context( c ) ) );
	await Promise.all( ctxs.map( ( c ) => c.watch() ) );
	console.log( 'Watching for changes…' );
} else {
	await Promise.all( configs.map( ( c ) => esbuild.build( c ) ) );
}
