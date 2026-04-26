<?php
/**
 * Filterable post-grid block (wpff-post-grid/post-grid).
 */

defined( 'ABSPATH' ) || exit;

class WPFF_Post_Grid {

	private static $instance = null;

	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	private function __construct() {
		add_action( 'init', array( $this, 'register_block' ) );
	}

	// -------------------------------------------------------------------------
	// Block registration
	// -------------------------------------------------------------------------

	public function register_block() {

		wp_register_script(
			'wpff-post-grid-editor',
			WPFF_PG_URL . 'blocks/wpff-post-grid/editor.min.js',
			array( 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-data', 'wp-server-side-render', 'wp-i18n' ),
			filemtime( WPFF_PG_DIR . 'blocks/wpff-post-grid/editor.min.js' ),
			false
		);

		wp_register_style(
			'wpff-post-grid-editor',
			WPFF_PG_URL . 'assets/css/wpff-post-grid-editor.min.css',
			array(),
			filemtime( WPFF_PG_DIR . 'assets/css/wpff-post-grid-editor.min.css' )
		);

		wp_register_style(
			'wpff-post-grid',
			WPFF_PG_URL . 'assets/css/wpff-post-grid.min.css',
			array(),
			filemtime( WPFF_PG_DIR . 'assets/css/wpff-post-grid.min.css' )
		);

		wp_register_script(
			'wpff-post-grid',
			WPFF_PG_URL . 'assets/js/wpff-post-grid.min.js',
			array(),
			filemtime( WPFF_PG_DIR . 'assets/js/wpff-post-grid.min.js' ),
			array(
				'strategy'  => 'defer',
				'in_footer' => true,
			)
		);

		register_block_type(
			'wpff-post-grid/post-grid',
			array(
				'render_callback' => array( $this, 'render_block' ),
				'editor_script'   => 'wpff-post-grid-editor',
				'editor_style'    => 'wpff-post-grid-editor',
				'style'           => 'wpff-post-grid',
				'script'          => 'wpff-post-grid',
				'attributes'      => array(
					'postType'          => array(
						'type'    => 'string',
						'default' => 'post',
					),
					'taxonomy'          => array(
						'type'    => 'string',
						'default' => '',
					),
					'postsPerPage'      => array(
						'type'    => 'integer',
						'default' => 12,
					),
					'orderBy'           => array(
						'type'    => 'string',
						'default' => 'date',
					),
					'order'             => array(
						'type'    => 'string',
						'default' => 'DESC',
					),
					'columns'           => array(
						'type'    => 'integer',
						'default' => 3,
					),
					'columnsMobile'     => array(
						'type'    => 'integer',
						'default' => 1,
					),
					'gap'               => array(
						'type'    => 'string',
						'default' => '1.5rem',
					),
					'showImage'         => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'imageSize'         => array(
						'type'    => 'string',
						'default' => 'medium',
					),
					'imageRatio'        => array(
						'type'    => 'string',
						'default' => '4/3',
					),
					'showPlaceholder'   => array(
						'type'    => 'boolean',
						'default' => false,
					),
					'showTitle'         => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'showExcerpt'       => array(
						'type'    => 'boolean',
						'default' => false,
					),
					'excerptLength'     => array(
						'type'    => 'integer',
						'default' => 30,
					),
					'showCategory'      => array(
						'type'    => 'boolean',
						'default' => false,
					),
					'backgroundColor'   => array(
						'type'    => 'string',
						'default' => '',
					),
					'borderColor'       => array(
						'type'    => 'string',
						'default' => '',
					),
					'borderWidth'       => array(
						'type'    => 'string',
						'default' => '0',
					),
					'borderRadius'      => array(
						'type'    => 'string',
						'default' => '0px',
					),
					'cardPadding'       => array(
						'type'    => 'string',
						'default' => '1rem',
					),
					'itemPadding'       => array(
						'type'    => 'string',
						'default' => '0',
					),
					'titleFontSize'     => array(
						'type'    => 'string',
						'default' => '',
					),
					'excerptFontSize'   => array(
						'type'    => 'string',
						'default' => '',
					),
					'categoryFontSize'  => array(
						'type'    => 'string',
						'default' => '',
					),
					'showDate'          => array(
						'type'    => 'boolean',
						'default' => false,
					),
					'showReadMore'      => array(
						'type'    => 'boolean',
						'default' => false,
					),
					'readMoreText'      => array(
						'type'    => 'string',
						'default' => 'Read More',
					),
					'linkTarget'        => array(
						'type'    => 'string',
						'default' => 'permalink',
					),
					'linkMetaField'     => array(
						'type'    => 'string',
						'default' => '',
					),
					'linkNewTab'        => array(
						'type'    => 'boolean',
						'default' => false,
					),
					'downloadLink'      => array(
						'type'    => 'boolean',
						'default' => false,
					),
					'filterAlign'       => array(
						'type'    => 'string',
						'default' => 'center',
					),
					'buttonStyle'       => array(
						'type'    => 'string',
						'default' => 'pill',
					),
					'showAllButton'     => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'allButtonText'     => array(
						'type'    => 'string',
						'default' => 'All',
					),
					'filterButtonColor' => array(
						'type'    => 'string',
						'default' => '',
					),
				),
			)
		);
	}

	// -------------------------------------------------------------------------
	// Front-end rendering
	// -------------------------------------------------------------------------

	public function render_block( $attrs ) {

		$post_type          = sanitize_key( $attrs['postType'] ?? 'post' );
		$taxonomy           = sanitize_key( $attrs['taxonomy'] ?? '' );
		$posts_per_page     = absint( $attrs['postsPerPage'] ?? 12 );
		$order_by           = sanitize_key( $attrs['orderBy'] ?? 'date' );
		$order              = in_array( strtoupper( $attrs['order'] ?? 'DESC' ), array( 'ASC', 'DESC' ), true )
							? strtoupper( $attrs['order'] ) : 'DESC';
		$columns            = min( max( absint( $attrs['columns'] ?? 3 ), 1 ), 6 );
		$cols_mobile        = min( max( absint( $attrs['columnsMobile'] ?? 1 ), 1 ), 6 );
		$gap                = $this->sanitize_css_length( $attrs['gap'] ?? '1.5rem' );
		$show_image         = (bool) ( $attrs['showImage'] ?? true );
		$image_size         = sanitize_key( $attrs['imageSize'] ?? 'medium' );
		$image_ratio        = $this->sanitize_ratio( $attrs['imageRatio'] ?? '4/3' );
		$show_placeholder   = (bool) ( $attrs['showPlaceholder'] ?? false );
		$show_title         = (bool) ( $attrs['showTitle'] ?? true );
		$show_excerpt       = (bool) ( $attrs['showExcerpt'] ?? false );
		$excerpt_length     = min( max( absint( $attrs['excerptLength'] ?? 30 ), 5 ), 100 );
		$show_category      = (bool) ( $attrs['showCategory'] ?? false );
		$bg_color           = sanitize_text_field( $attrs['backgroundColor'] ?? '' );
		$border_color       = sanitize_text_field( $attrs['borderColor'] ?? '' );
		$border_width       = $this->sanitize_css_length( $attrs['borderWidth'] ?? '0', '0' );
		$raw_radius         = $attrs['borderRadius'] ?? '0px';
		$border_radius      = $this->sanitize_css_length( is_numeric( $raw_radius ) ? absint( $raw_radius ) . 'px' : $raw_radius, '0px' );
		$card_padding       = $this->sanitize_css_padding( $attrs['cardPadding'] ?? '1rem' );
		$item_padding       = $this->sanitize_css_padding( $attrs['itemPadding'] ?? '0' );
		$title_font_size    = $this->sanitize_font_size( $attrs['titleFontSize'] ?? '' );
		$excerpt_font_size  = $this->sanitize_font_size( $attrs['excerptFontSize'] ?? '' );
		$category_font_size = $this->sanitize_font_size( $attrs['categoryFontSize'] ?? '' );
		$show_date          = (bool) ( $attrs['showDate'] ?? false );
		$show_read_more     = (bool) ( $attrs['showReadMore'] ?? false );
		$read_more_text     = sanitize_text_field( $attrs['readMoreText'] ?? 'Read More' );
		$link_target        = in_array( $attrs['linkTarget'] ?? 'permalink', array( 'permalink', 'meta_field' ), true )
							? $attrs['linkTarget'] : 'permalink';
		$link_meta_field    = sanitize_key( $attrs['linkMetaField'] ?? '' );
		$link_new_tab       = (bool) ( $attrs['linkNewTab'] ?? false );
		$link_tab_attrs     = $link_new_tab ? ' target="_blank" rel="noopener noreferrer"' : '';
		$download_link      = (bool) ( $attrs['downloadLink'] ?? false );
		$read_more_attrs    = $download_link ? ' download' : $link_tab_attrs;
		$filter_align       = in_array( $attrs['filterAlign'] ?? 'center', array( 'left', 'center', 'right' ), true )
							? $attrs['filterAlign'] : 'center';
		$btn_style          = in_array( $attrs['buttonStyle'] ?? 'pill', array( 'pill', 'square', 'outline' ), true )
							? $attrs['buttonStyle'] : 'pill';
		$show_all           = (bool) ( $attrs['showAllButton'] ?? true );
		$all_text           = sanitize_text_field( $attrs['allButtonText'] ?? 'All' );
		$btn_color          = sanitize_text_field( $attrs['filterButtonColor'] ?? '' );

		if ( ! post_type_exists( $post_type ) ) {
			$post_type = 'post';
		}

		$query_args = array(
			'post_type'      => $post_type,
			'posts_per_page' => $posts_per_page ? $posts_per_page : -1,
			'post_status'    => 'publish',
			'orderby'        => $order_by,
			'order'          => $order,
			'no_found_rows'  => true,
		);

		$queried = get_queried_object();
		if ( $queried instanceof WP_Term && taxonomy_exists( $queried->taxonomy ) ) {
			$query_args['tax_query'] = array(
				array(
					'taxonomy' => $queried->taxonomy,
					'field'    => 'term_id',
					'terms'    => $queried->term_id,
				),
			);
		}

		$query = new WP_Query( $query_args );

		if ( ! $query->have_posts() ) {
			$pt_obj        = get_post_type_object( $post_type );
			$pt_label      = $pt_obj ? strtolower( $pt_obj->labels->name ) : 'posts';
			$empty_message = sprintf( /* translators: %s: post type plural name */ __( 'No %s found.', 'wpff-post-grid' ), $pt_label );
			return '<div class="wpff-pg-empty">' . esc_html( $empty_message ) . '</div>';
		}

		$terms = array();
		if ( $taxonomy && taxonomy_exists( $taxonomy ) ) {
			$raw = get_terms(
				array(
					'taxonomy'   => $taxonomy,
					'hide_empty' => true,
					'object_ids' => wp_list_pluck( $query->posts, 'ID' ),
				)
			);
			if ( ! is_wp_error( $raw ) ) {
				$terms = $raw;
			}
		}

		$style = sprintf(
			'--wpff-pg-cols:%d;--wpff-pg-cols-mobile:%d;--wpff-pg-gap:%s;--wpff-pg-ratio:%s;--wpff-pg-bg:%s;--wpff-pg-radius:%s;--wpff-pg-card-padding:%s;--wpff-pg-item-padding:%s;%s%s%s%s',
			$columns,
			$cols_mobile,
			esc_attr( $gap ),
			esc_attr( $image_ratio ),
			$bg_color ? esc_attr( $bg_color ) : 'transparent',
			esc_attr( $border_radius ),
			esc_attr( $card_padding ),
			esc_attr( $item_padding ),
			( $border_color && '0' !== $border_width ) ? '--wpff-pg-border:' . esc_attr( $border_width ) . ' solid ' . esc_attr( $border_color ) . ';' : '',
			$title_font_size ? '--wpff-pg-title-fs:' . esc_attr( $title_font_size ) . ';' : '',
			$excerpt_font_size ? '--wpff-pg-excerpt-fs:' . esc_attr( $excerpt_font_size ) . ';' : '',
			$category_font_size ? '--wpff-pg-category-fs:' . esc_attr( $category_font_size ) . ';' : ''
		);

		ob_start();
		?>
		<div class="wpff-pg-block" style="<?php echo esc_attr( $style ); ?>">

			<?php if ( ! empty( $terms ) ) : ?>
			<div class="wpff-pg-filters wpff-pg-filters--<?php echo esc_attr( $filter_align ); ?>"
				role="group"
				aria-label="<?php esc_attr_e( 'Filter posts', 'wpff-post-grid' ); ?>"
				<?php
				if ( $btn_color ) :
					?>
					style="--wpff-pg-btn-color:<?php echo esc_attr( $btn_color ); ?>;"<?php endif; ?>>

				<?php if ( $show_all ) : ?>
				<button class="wpff-pg-filter-btn wpff-pg-filter-btn--<?php echo esc_attr( $btn_style ); ?> is-active"
						data-term="all" aria-pressed="true">
					<?php echo esc_html( $all_text ); ?>
				</button>
				<?php endif; ?>

				<?php foreach ( $terms as $term ) : ?>
				<button class="wpff-pg-filter-btn wpff-pg-filter-btn--<?php echo esc_attr( $btn_style ); ?>"
						data-term="<?php echo esc_attr( $term->slug ); ?>" aria-pressed="false">
					<?php echo esc_html( $term->name ); ?>
				</button>
				<?php endforeach; ?>

			</div>
			<?php endif; ?>

			<div class="wpff-pg-grid">
				<?php
				$item_index = 0;
				while ( $query->have_posts() ) :
					$query->the_post();
					?>
					<?php
					$post_id         = get_the_ID();
					$term_slugs      = '';
					$first_term_name = '';
					if ( $taxonomy && taxonomy_exists( $taxonomy ) ) {
						$post_terms = get_the_terms( $post_id, $taxonomy );
						if ( $post_terms && ! is_wp_error( $post_terms ) ) {
							$term_slugs      = implode( ' ', wp_list_pluck( $post_terms, 'slug' ) );
							$first_term_name = $post_terms[0]->name;
						}
					}
					if ( 'meta_field' === $link_target && $link_meta_field ) {
						$meta     = get_post_meta( $post_id, $link_meta_field, true );
						$item_url = $meta ? esc_url( $meta ) : esc_url( get_permalink() );
					} else {
						$item_url = esc_url( get_permalink() );
					}
					?>
				<article class="wpff-pg-item" data-terms="<?php echo esc_attr( $term_slugs ); ?>">

					<?php if ( $show_image && has_post_thumbnail() ) : ?>
					<a class="wpff-pg-item__image-wrap" href="<?php echo $item_url; ?>"<?php echo $link_tab_attrs; ?> tabindex="-1" aria-hidden="true">
						<?php
						echo get_the_post_thumbnail(
							$post_id,
							$image_size,
							0 === $item_index
								? array(
									'class'         => 'wpff-pg-item__image',
									'loading'       => 'eager',
									'fetchpriority' => 'high',
									'alt'           => the_title_attribute( array( 'echo' => false ) ),
								)
								: array(
									'class'   => 'wpff-pg-item__image',
									'loading' => 'lazy',
									'alt'     => the_title_attribute( array( 'echo' => false ) ),
								)
						);
						?>
					</a>
					<?php elseif ( $show_image && ! has_post_thumbnail() && $show_placeholder ) : ?>
					<a class="wpff-pg-item__image-wrap" href="<?php echo $item_url; ?>"<?php echo $link_tab_attrs; ?> tabindex="-1" aria-hidden="true">
						<img
							class="wpff-pg-item__image"
							src="<?php echo esc_url( WPFF_PG_URL . 'assets/images/placeholder.webp' ); ?>"
							alt="Placeholder"
							<?php echo 0 === $item_index ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"'; ?>
						/>
					</a>
					<?php elseif ( $show_image && ! has_post_thumbnail() ) : ?>
					<figure class="wpff-pg-item__image-wrap" aria-hidden="true"></figure>
					<?php endif; ?>

					<?php if ( $show_title || $show_excerpt || $show_date || $show_read_more ) : ?>
					<div class="wpff-pg-item__body">

						<?php if ( $show_date ) : ?>
						<time class="wpff-pg-item__date" datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>">
							<?php echo esc_html( get_the_date() ); ?>
						</time>
						<?php endif; ?>

						<?php if ( $show_category && $first_term_name ) : ?>
						<span class="wpff-pg-item__category"><?php echo esc_html( $first_term_name ); ?></span>
						<?php endif; ?>

						<?php if ( $show_title ) : ?>
						<h3 class="wpff-pg-item__title">
							<a href="<?php echo $item_url; ?>"<?php echo $link_tab_attrs; ?>><?php the_title(); ?></a>
						</h3>
						<?php endif; ?>

						<?php if ( $show_excerpt ) : ?>
						<p class="wpff-pg-item__excerpt"><?php echo esc_html( wp_trim_words( get_the_excerpt(), $excerpt_length, '…' ) ); ?></p>
						<?php endif; ?>

						<?php if ( $show_read_more ) : ?>
						<a class="wpff-pg-item__readmore" href="<?php echo $item_url; ?>"<?php echo $read_more_attrs; ?>>
							<?php echo esc_html( $read_more_text ); ?>
						</a>
						<?php endif; ?>

					</div>
					<?php endif; ?>

				</article>
					<?php
					++$item_index;
				endwhile;
				wp_reset_postdata();
				?>
			</div>

		</div>
		<?php
		return ob_get_clean();
	}

	// -------------------------------------------------------------------------
	// Helpers
	// -------------------------------------------------------------------------

	private function sanitize_font_size( $value ) {
		if ( empty( $value ) ) {
			return '';
		}
		if ( preg_match( '/^var\(--[\w-]+\)$/', $value ) ) {
			return $value;
		}
		if ( '0' === $value || preg_match( '/^[\d.]+(px|rem|em|%)$/', $value ) ) {
			return $value;
		}
		return '';
	}

	private function sanitize_css_length( $value, $fallback = '1.5rem' ) {
		if ( '0' === $value || preg_match( '/^[\d.]+(px|rem|em|%|vh|vw)$/', $value ) ) {
			return $value;
		}
		return $fallback;
	}

	private function sanitize_css_padding( $value ) {
		$value = sanitize_text_field( $value );
		if ( empty( $value ) || '0' === $value ) {
			return '0';
		}
		$parts     = preg_split( '/\s+/', trim( $value ) );
		$sanitized = array();
		foreach ( $parts as $part ) {
			if ( '0' === $part || preg_match( '/^[\d.]+(px|rem|em|%|vh|vw)$/', $part ) ) {
				$sanitized[] = $part;
			} else {
				return '0';
			}
		}
		if ( count( $sanitized ) < 1 || count( $sanitized ) > 4 ) {
			return '0';
		}
		return implode( ' ', $sanitized );
	}

	private function sanitize_ratio( $value ) {
		if ( preg_match( '/^\d+\/\d+$/', $value ) ) {
			return $value;
		}
		return '4/3';
	}
}
