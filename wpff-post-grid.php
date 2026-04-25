<?php
/**
 * Plugin Name: WP Fix Fast Post Grid
 * Description: Filterable post grid Gutenberg block with taxonomy filter buttons.
 * Version:     1.0.4
 * Author:      Ozgur Sar
 * Author URI:  https://wpfixfast.com/
 * Plugin URI:  https://wpfixfast.com/
 * Text Domain: wpff-post-grid
 * Requires at least: 6.0
 * Requires PHP: 7.4
 */

defined( 'ABSPATH' ) || exit;

define( 'WPFF_PG_FILE', __FILE__ );
define( 'WPFF_PG_DIR', plugin_dir_path( __FILE__ ) );
define( 'WPFF_PG_URL', plugin_dir_url( __FILE__ ) );

require_once WPFF_PG_DIR . 'includes/class-wpff-post-grid.php';

add_action( 'plugins_loaded', array( 'WPFF_Post_Grid', 'get_instance' ) );
