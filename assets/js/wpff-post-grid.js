/**
 * WPFF Post Grid – Frontend Filtering
 */
( function () {
	'use strict';

	/**
	 * Attach filter behaviour to a single .wpff-isn-block element.
	 */
	function initGrid( block ) {
		const filterBtns = block.querySelectorAll( '.wpff-isn-filter-btn' );
		const items      = block.querySelectorAll( '.wpff-isn-item' );

		if ( ! filterBtns.length ) return;

		// Give each card a unique view-transition-name so cards animate independently
		items.forEach( function ( item, i ) {
			item.style.viewTransitionName = 'wpff-isn-item-' + i;
		} );

		filterBtns.forEach( function ( btn ) {
			btn.addEventListener( 'click', function () {
				const term = btn.dataset.term;

				// Update button active state
				filterBtns.forEach( function ( b ) {
					b.classList.remove( 'is-active' );
					b.setAttribute( 'aria-pressed', 'false' );
				} );
				btn.classList.add( 'is-active' );
				btn.setAttribute( 'aria-pressed', 'true' );

				function applyFilter() {
					items.forEach( function ( item ) {
						const terms = item.dataset.terms
						            ? item.dataset.terms.trim().split( /\s+/ )
						            : [];

						if ( term === 'all' || terms.includes( term ) ) {
							item.classList.remove( 'is-hidden' );
							item.removeAttribute( 'aria-hidden' );
						} else {
							item.classList.add( 'is-hidden' );
							item.setAttribute( 'aria-hidden', 'true' );
						}
					} );
				}

				// Use View Transitions API when available, fall back to instant toggle
				if ( document.startViewTransition ) {
					document.startViewTransition( applyFilter );
				} else {
					applyFilter();
				}
			} );
		} );
	}

	function initAll() {
		document.querySelectorAll( '.wpff-isn-block' ).forEach( initGrid );
	}

	document.addEventListener( 'DOMContentLoaded', initAll );

	// Support blocks injected after initial load (e.g. ServerSideRender previews)
	const observer = new MutationObserver( function ( mutations ) {
		mutations.forEach( function ( m ) {
			m.addedNodes.forEach( function ( node ) {
				if ( node.nodeType !== 1 ) return;
				if ( node.classList && node.classList.contains( 'wpff-isn-block' ) ) {
					initGrid( node );
				} else if ( node.querySelectorAll ) {
					node.querySelectorAll( '.wpff-isn-block' ).forEach( initGrid );
				}
			} );
		} );
	} );
	observer.observe( document.body, { childList: true, subtree: true } );

} )();
