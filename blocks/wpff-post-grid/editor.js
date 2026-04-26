/**
 * WPFF Post Grid – Block Editor Component
 */
;(function () {
  'use strict'

  const el = wp.element.createElement
  const __ = wp.i18n.__
  const registerBlockType = wp.blocks.registerBlockType
  const InspectorControls = wp.blockEditor.InspectorControls
  const useBlockProps = wp.blockEditor.useBlockProps
  const PanelBody = wp.components.PanelBody
  const SelectControl = wp.components.SelectControl
  const RangeControl = wp.components.RangeControl
  const ToggleControl = wp.components.ToggleControl
  const TextControl = wp.components.TextControl
  const Placeholder = wp.components.Placeholder
  const ColorPalette = wp.components.ColorPalette
  const UnitControl = wp.components.__experimentalUnitControl
  const useSettings = wp.blockEditor.useSettings
  const ServerSideRender = wp.serverSideRender
  const useSelect = wp.data.useSelect
  const useState = wp.element.useState
  const useEffect = wp.element.useEffect

  // Post types excluded from the selector
  const EXCLUDED_TYPES = [
    'attachment',
    'nav_menu_item',
    'wp_block',
    'wp_template',
    'wp_template_part',
    'wp_navigation',
    'wp_font_family',
    'wp_font_face',
    'wp_global_styles',
    'wp_css',
    'wp_widget_page'
  ]

  const PADDING_UNITS = [
    { value: 'px', label: 'px', default: 0 },
    { value: 'rem', label: 'rem', default: 0 },
    { value: 'em', label: 'em', default: 0 },
    { value: '%', label: '%', default: 0 }
  ]

  const SPACING_UNITS = [
    { value: 'rem', label: 'rem', default: 1.5 },
    { value: 'px', label: 'px', default: 24 },
    { value: 'em', label: 'em', default: 1.5 }
  ]

  // -------------------------------------------------------------------------
  // Block definition
  // -------------------------------------------------------------------------

  registerBlockType('wpff-post-grid/post-grid', {
    title: __('Post Grid', 'wpff-post-grid'),
    description: __('Filterable post grid with taxonomy filter buttons.', 'wpff-post-grid'),
    category: 'widgets',
    icon: 'grid-view',
    supports: { html: false },

    attributes: {
      postType: { type: 'string', default: 'post' },
      taxonomy: { type: 'string', default: '' },
      postsPerPage: { type: 'integer', default: 12 },
      orderBy: { type: 'string', default: 'date' },
      order: { type: 'string', default: 'DESC' },
      columns: { type: 'integer', default: 3 },
      columnsMobile: { type: 'integer', default: 1 },
      gap: { type: 'string', default: '1.5rem' },
      showImage: { type: 'boolean', default: true },
      imageSize: { type: 'string', default: 'medium' },
      imageRatio: { type: 'string', default: '4/3' },
      showPlaceholder: { type: 'boolean', default: false },
      showTitle: { type: 'boolean', default: true },
      showExcerpt: { type: 'boolean', default: false },
      excerptLength: { type: 'integer', default: 30 },
      showCategory: { type: 'boolean', default: false },
      backgroundColor: { type: 'string', default: '' },
      borderColor: { type: 'string', default: '' },
      borderWidth: { type: 'string', default: '0' },
      borderRadius: { type: 'string', default: '0px' },
      cardPadding: { type: 'string', default: '1rem' },
      itemPadding: { type: 'string', default: '0' },
      titleFontSize: { type: 'string', default: '' },
      excerptFontSize: { type: 'string', default: '' },
      categoryFontSize: { type: 'string', default: '' },
      showDate: { type: 'boolean', default: false },
      showReadMore: { type: 'boolean', default: false },
      readMoreText: { type: 'string', default: 'Read More' },
      linkTarget: { type: 'string', default: 'permalink' },
      linkMetaField: { type: 'string', default: '' },
      linkNewTab: { type: 'boolean', default: false },
      downloadLink: { type: 'boolean', default: false },
      filterAlign: { type: 'string', default: 'center' },
      buttonStyle: { type: 'string', default: 'pill' },
      showAllButton: { type: 'boolean', default: true },
      allButtonText: { type: 'string', default: 'All' },
      filterButtonColor: { type: 'string', default: '' },
      showNoPostsMessage: { type: 'boolean', default: true }
    },

    // -----------------------------------------------------------------------
    // Edit
    // -----------------------------------------------------------------------

    edit: function (props) {
      const attrs = props.attributes
      const setAttr = props.setAttributes

      // Load all registered post types from the REST API
      const postTypes = useSelect(function (select) {
        return select('core').getPostTypes({ per_page: -1 })
      }, [])

      // Load all registered taxonomies
      const taxonomies = useSelect(function (select) {
        return select('core').getTaxonomies({ per_page: -1 })
      }, [])

      // Build SelectControl options for post types
      const postTypeOptions = [{ value: '', label: __('— Select post type —', 'wpff-post-grid') }]
      if (postTypes) {
        postTypes
          .filter(function (pt) {
            return !EXCLUDED_TYPES.includes(pt.slug) && pt.show_ui !== false
          })
          .forEach(function (pt) {
            postTypeOptions.push({ value: pt.slug, label: pt.name })
          })
      }

      // Build SelectControl options for taxonomies filtered to the selected CPT
      const taxOptions = [{ value: '', label: __('— No filter —', 'wpff-post-grid') }]
      if (taxonomies && attrs.postType) {
        taxonomies
          .filter(function (tax) {
            return Array.isArray(tax.types) && tax.types.includes(attrs.postType)
          })
          .forEach(function (tax) {
            taxOptions.push({ value: tax.slug, label: tax.name })
          })
      }

      // Merge theme + user-custom + default colours so all palette entries are available
      const colorSources = useSettings('color.palette.theme', 'color.palette.custom', 'color.palette.default')
      const allColors = [].concat(colorSources[0] || [], colorSources[1] || [], colorSources[2] || [])

      // Font sizes from theme settings
      const fontSizeSources = useSettings('typography.fontSizes.theme')
      const allFontSizes = [].concat(fontSizeSources[0] || [])
      const fontSizeOptions = [{ value: '', label: __('— Default —', 'wpff-post-grid') }].concat(
        allFontSizes.map(function (fs) {
          return { value: 'var(--wp--preset--font-size--' + fs.slug + ')', label: fs.name }
        })
      )

      // Fetch registered meta fields for the selected post type via REST schema
      const [metaFields, setMetaFields] = useState([])
      useEffect(
        function () {
          if (!attrs.postType) {
            setMetaFields([])
            return
          }
          const ptData = wp.data.select('core').getPostType(attrs.postType)
          const restBase = ptData ? ptData.rest_base : attrs.postType + 's'
          wp.apiFetch({ path: '/wp/v2/' + restBase, method: 'OPTIONS' })
            .then(function (res) {
              const props =
                res &&
                res.schema &&
                res.schema.properties &&
                res.schema.properties.meta &&
                res.schema.properties.meta.properties
              setMetaFields(props ? Object.keys(props) : [])
            })
            .catch(function () {
              setMetaFields([])
            })
        },
        [attrs.postType]
      )

      const blockProps = useBlockProps({ className: 'wpff-pg-editor-wrap' })

      return el(
        'div',
        blockProps,

        // -----------------------------------------------------------
        // Inspector Controls (sidebar panels)
        // -----------------------------------------------------------
        el(
          InspectorControls,
          null,

          // Query Settings
          el(
            PanelBody,
            { title: __('Query Settings', 'wpff-post-grid'), initialOpen: true },

            el(SelectControl, {
              label: __('Post Type', 'wpff-post-grid'),
              value: attrs.postType,
              options: postTypeOptions,
              onChange: function (v) {
                setAttr({ postType: v, taxonomy: '' })
              }
            }),

            el(SelectControl, {
              label: __('Filter Taxonomy', 'wpff-post-grid'),
              value: attrs.taxonomy,
              options: taxOptions,
              onChange: function (v) {
                setAttr({ taxonomy: v })
              },
              help: !attrs.taxonomy ? __('No filter buttons will be shown.', 'wpff-post-grid') : null
            }),

            el(RangeControl, {
              label: __('Posts Per Page', 'wpff-post-grid'),
              value: attrs.postsPerPage,
              min: 1,
              max: 999,
              onChange: function (v) {
                setAttr({ postsPerPage: v })
              }
            }),

            el(SelectControl, {
              label: __('Order By', 'wpff-post-grid'),
              value: attrs.orderBy,
              options: [
                { value: 'date', label: __('Date', 'wpff-post-grid') },
                { value: 'title', label: __('Title', 'wpff-post-grid') },
                { value: 'menu_order', label: __('Menu Order', 'wpff-post-grid') },
                { value: 'modified', label: __('Last Modified', 'wpff-post-grid') },
                { value: 'rand', label: __('Random', 'wpff-post-grid') }
              ],
              onChange: function (v) {
                setAttr({ orderBy: v })
              }
            }),

            el(SelectControl, {
              label: __('Order', 'wpff-post-grid'),
              value: attrs.order,
              options: [
                { value: 'DESC', label: __('Descending', 'wpff-post-grid') },
                { value: 'ASC', label: __('Ascending', 'wpff-post-grid') }
              ],
              onChange: function (v) {
                setAttr({ order: v })
              }
            }),

            el(ToggleControl, {
              label: __('Show "No Posts Found" Message', 'wpff-post-grid'),
              checked: attrs.showNoPostsMessage,
              onChange: function (v) {
                setAttr({ showNoPostsMessage: v })
              }
            })
          ),

          // Layout
          el(
            PanelBody,
            { title: __('Layout', 'wpff-post-grid'), initialOpen: false },

            el(RangeControl, {
              label: __('Columns (Desktop)', 'wpff-post-grid'),
              value: attrs.columns,
              min: 1,
              max: 6,
              onChange: function (v) {
                setAttr({ columns: v })
              }
            }),

            el(RangeControl, {
              label: __('Columns (Mobile)', 'wpff-post-grid'),
              value: attrs.columnsMobile,
              min: 1,
              max: 4,
              onChange: function (v) {
                setAttr({ columnsMobile: v })
              }
            }),

            el(UnitControl, {
              label: __('Gap', 'wpff-post-grid'),
              value: attrs.gap,
              units: SPACING_UNITS,
              min: 0,
              onChange: function (v) {
                setAttr({ gap: v || '0' })
              }
            })
          ),

          // Card Settings
          el(
            PanelBody,
            { title: __('Card Settings', 'wpff-post-grid'), initialOpen: false },

            el(ToggleControl, {
              label: __('Show Featured Image', 'wpff-post-grid'),
              checked: attrs.showImage,
              onChange: function (v) {
                setAttr({ showImage: v })
              }
            }),

            attrs.showImage &&
              el(SelectControl, {
                label: __('Image Size', 'wpff-post-grid'),
                value: attrs.imageSize,
                options: [
                  { value: 'thumbnail', label: __('Thumbnail', 'wpff-post-grid') },
                  { value: 'medium', label: __('Medium', 'wpff-post-grid') },
                  { value: 'medium_large', label: __('Medium Large', 'wpff-post-grid') },
                  { value: 'large', label: __('Large', 'wpff-post-grid') },
                  { value: 'full', label: __('Full', 'wpff-post-grid') }
                ],
                onChange: function (v) {
                  setAttr({ imageSize: v })
                }
              }),

            attrs.showImage &&
              el(SelectControl, {
                label: __('Image Ratio', 'wpff-post-grid'),
                value: attrs.imageRatio,
                options: [
                  { value: '1/1', label: __('Square (1:1)', 'wpff-post-grid') },
                  { value: '4/3', label: __('Landscape (4:3)', 'wpff-post-grid') },
                  { value: '3/2', label: __('Standard (3:2)', 'wpff-post-grid') },
                  { value: '16/9', label: __('Widescreen (16:9)', 'wpff-post-grid') },
                  { value: '2/3', label: __('Portrait (2:3)', 'wpff-post-grid') },
                  { value: '3/4', label: __('Portrait (3:4)', 'wpff-post-grid') }
                ],
                onChange: function (v) {
                  setAttr({ imageRatio: v })
                }
              }),

            attrs.showImage &&
              el(ToggleControl, {
                label: __('Use Placeholder for Missing Images', 'wpff-post-grid'),
                checked: attrs.showPlaceholder,
                onChange: function (v) {
                  setAttr({ showPlaceholder: v })
                }
              }),

            el(ToggleControl, {
              label: __('Show Title', 'wpff-post-grid'),
              checked: attrs.showTitle,
              onChange: function (v) {
                setAttr({ showTitle: v })
              }
            }),

            el(ToggleControl, {
              label: __('Show Category Above Title', 'wpff-post-grid'),
              checked: attrs.showCategory,
              onChange: function (v) {
                setAttr({ showCategory: v })
              },
              help:
                attrs.showCategory && !attrs.taxonomy
                  ? __('Select a Filter Taxonomy in Query Settings to populate this.', 'wpff-post-grid')
                  : null
            }),

            el(ToggleControl, {
              label: __('Show Excerpt', 'wpff-post-grid'),
              checked: attrs.showExcerpt,
              onChange: function (v) {
                setAttr({ showExcerpt: v })
              }
            }),

            attrs.showExcerpt &&
              el(RangeControl, {
                label: __('Excerpt Length (words)', 'wpff-post-grid'),
                value: attrs.excerptLength,
                min: 5,
                max: 100,
                onChange: function (v) {
                  setAttr({ excerptLength: v })
                }
              }),

            el(ToggleControl, {
              label: __('Show Date', 'wpff-post-grid'),
              checked: attrs.showDate,
              onChange: function (v) {
                setAttr({ showDate: v })
              }
            }),

            el(ToggleControl, {
              label: __('Show Read More Button', 'wpff-post-grid'),
              checked: attrs.showReadMore,
              onChange: function (v) {
                setAttr({ showReadMore: v })
              }
            }),

            attrs.showReadMore &&
              el(TextControl, {
                label: __('Read More Button Text', 'wpff-post-grid'),
                value: attrs.readMoreText,
                onChange: function (v) {
                  setAttr({ readMoreText: v })
                }
              }),

            attrs.showReadMore &&
              el(ToggleControl, {
                label: __('Download File', 'wpff-post-grid'),
                help: __(
                  'Adds a download attribute to the Read More link. Open in New Tab still applies to image and title links.',
                  'wpff-post-grid'
                ),
                checked: attrs.downloadLink,
                onChange: function (v) {
                  setAttr({ downloadLink: v })
                }
              }),

            allFontSizes.length > 0 &&
              el(SelectControl, {
                label: __('Title Font Size', 'wpff-post-grid'),
                value: attrs.titleFontSize,
                options: fontSizeOptions,
                onChange: function (v) {
                  setAttr({ titleFontSize: v })
                }
              }),

            attrs.showExcerpt &&
              allFontSizes.length > 0 &&
              el(SelectControl, {
                label: __('Excerpt Font Size', 'wpff-post-grid'),
                value: attrs.excerptFontSize,
                options: fontSizeOptions,
                onChange: function (v) {
                  setAttr({ excerptFontSize: v })
                }
              }),

            attrs.showCategory &&
              allFontSizes.length > 0 &&
              el(SelectControl, {
                label: __('Category Font Size', 'wpff-post-grid'),
                value: attrs.categoryFontSize,
                options: fontSizeOptions,
                onChange: function (v) {
                  setAttr({ categoryFontSize: v })
                }
              })
          ),

          // Link Settings
          el(
            PanelBody,
            { title: __('Link Settings', 'wpff-post-grid'), initialOpen: false },

            el(SelectControl, {
              label: __('Link Target', 'wpff-post-grid'),
              value: attrs.linkTarget,
              options: [
                { value: 'permalink', label: __('Post Permalink', 'wpff-post-grid') },
                { value: 'meta_field', label: __('Custom Meta Field', 'wpff-post-grid') }
              ],
              onChange: function (v) {
                setAttr({ linkTarget: v })
              }
            }),

            attrs.linkTarget === 'meta_field' &&
              (metaFields.length > 0
                ? el(SelectControl, {
                    label: __('Meta Field Key', 'wpff-post-grid'),
                    value: attrs.linkMetaField,
                    options: [{ value: '', label: __('— Select a field —', 'wpff-post-grid') }].concat(
                      metaFields.map(function (key) {
                        return { value: key, label: key }
                      })
                    ),
                    onChange: function (v) {
                      setAttr({ linkMetaField: v })
                    },
                    help: __('Registered meta fields for this post type.', 'wpff-post-grid')
                  })
                : el(TextControl, {
                    label: __('Meta Field Key', 'wpff-post-grid'),
                    value: attrs.linkMetaField,
                    onChange: function (v) {
                      setAttr({ linkMetaField: v })
                    },
                    help: __(
                      'No registered meta fields found. Enter the key manually, e.g. literature_pdf_url',
                      'wpff-post-grid'
                    )
                  })),

            el(ToggleControl, {
              label: __('Open in New Tab', 'wpff-post-grid'),
              checked: attrs.linkNewTab,
              onChange: function (v) {
                setAttr({ linkNewTab: v })
              }
            })
          ),

          // Card Color – all palette sources merged (theme + user custom + default)
          el(
            PanelBody,
            { title: __('Card Color', 'wpff-post-grid'), initialOpen: false },
            el(
              'p',
              { style: { marginBottom: '8px', fontSize: '11px', fontWeight: '500', textTransform: 'uppercase' } },
              __('Card Background', 'wpff-post-grid')
            ),
            el(ColorPalette, {
              colors: allColors,
              value: attrs.backgroundColor,
              onChange: function (v) {
                setAttr({ backgroundColor: v || '' })
              }
            }),
            el(
              'p',
              { style: { marginTop: '16px', marginBottom: '8px', fontSize: '11px', fontWeight: '500', textTransform: 'uppercase' } },
              __('Card Border', 'wpff-post-grid')
            ),
            el(ColorPalette, {
              colors: allColors,
              value: attrs.borderColor,
              onChange: function (v) {
                setAttr({ borderColor: v || '' })
              }
            })
          ),

          // Style
          el(
            PanelBody,
            { title: __('Style', 'wpff-post-grid'), initialOpen: false },

            el(UnitControl, {
              label: __('Card Border Width', 'wpff-post-grid'),
              value: attrs.borderWidth,
              units: PADDING_UNITS,
              min: 0,
              onChange: function (v) {
                setAttr({ borderWidth: v || '0' })
              }
            }),

            el(UnitControl, {
              label: __('Card Border Radius', 'wpff-post-grid'),
              value: attrs.borderRadius,
              units: PADDING_UNITS,
              min: 0,
              onChange: function (v) {
                setAttr({ borderRadius: v || '0px' })
              }
            }),

            el(TextControl, {
              label: __('Card Item Padding', 'wpff-post-grid'),
              help: __('CSS shorthand — e.g. 1rem, 10px 20px.', 'wpff-post-grid'),
              value: attrs.itemPadding,
              onChange: function (v) {
                setAttr({ itemPadding: v })
              }
            }),

            el(TextControl, {
              label: __('Card Content Padding', 'wpff-post-grid'),
              help: __('CSS shorthand — e.g. 1rem, 10px 20px.', 'wpff-post-grid'),
              value: attrs.cardPadding,
              onChange: function (v) {
                setAttr({ cardPadding: v })
              }
            })
          ),

          // Filter Buttons
          el(
            PanelBody,
            { title: __('Filter Buttons', 'wpff-post-grid'), initialOpen: false },

            el(SelectControl, {
              label: __('Button Alignment', 'wpff-post-grid'),
              value: attrs.filterAlign,
              options: [
                { value: 'left', label: __('Left', 'wpff-post-grid') },
                { value: 'center', label: __('Center', 'wpff-post-grid') },
                { value: 'right', label: __('Right', 'wpff-post-grid') }
              ],
              onChange: function (v) {
                setAttr({ filterAlign: v })
              }
            }),

            el(SelectControl, {
              label: __('Button Style', 'wpff-post-grid'),
              value: attrs.buttonStyle,
              options: [
                { value: 'pill', label: __('Pill', 'wpff-post-grid') },
                { value: 'square', label: __('Square', 'wpff-post-grid') },
                { value: 'outline', label: __('Outline only', 'wpff-post-grid') }
              ],
              onChange: function (v) {
                setAttr({ buttonStyle: v })
              }
            }),

            el(ToggleControl, {
              label: __('Show "All" Button', 'wpff-post-grid'),
              checked: attrs.showAllButton,
              onChange: function (v) {
                setAttr({ showAllButton: v })
              }
            }),

            attrs.showAllButton &&
              el(TextControl, {
                label: __('"All" Button Label', 'wpff-post-grid'),
                value: attrs.allButtonText,
                onChange: function (v) {
                  setAttr({ allButtonText: v })
                }
              }),

            el(
              'p',
              {
                style: {
                  marginTop: '16px',
                  marginBottom: '8px',
                  fontSize: '11px',
                  fontWeight: '500',
                  textTransform: 'uppercase'
                }
              },
              __('Button Color', 'wpff-post-grid')
            ),
            el(ColorPalette, {
              colors: allColors,
              value: attrs.filterButtonColor,
              onChange: function (v) {
                setAttr({ filterButtonColor: v || '' })
              }
            })
          )
        ),

        // -----------------------------------------------------------
        // Editor preview (server-side rendered)
        // -----------------------------------------------------------
        attrs.postType
          ? el(ServerSideRender, {
              block: 'wpff-post-grid/post-grid',
              attributes: attrs,
              LoadingResponsePlaceholder: function () {
                return el('div', { className: 'wpff-pg-editor-loading' }, __('Loading preview…', 'wpff-post-grid'))
              }
            })
          : el(Placeholder, {
              icon: 'grid-view',
              label: __('Post Grid', 'wpff-post-grid'),
              instructions: __('Select a post type in the block settings to display a grid.', 'wpff-post-grid')
            })
      )
    },

    // -----------------------------------------------------------------------
    // Save – fully server-side rendered
    // -----------------------------------------------------------------------
    save: function () {
      return null
    }
  })
})()
