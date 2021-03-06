//clear url filter
$( '#clear_btn' ).on( 'click', function ( event ) {
    $( '#url_filter' ).val( '' ).trigger( 'input' )
} )

function showStatus( txt ) {
    $( '#status' ).html( txt )
}

$( '#start,#stop' ).on( 'click', function ( event ) {
    if ( $( this ).hasClass( 'disabled' ) ) return
    $( this ).addClass( 'disabled' )
    if ( $( this ).attr( 'id' ) == 'start' ) {
        startProxy( function () {
            showStatus( '服务运行中' )
            $( '#stop' ).removeClass( 'disabled' )
            $( '#port' ).attr( 'readonly', 'true' );
        } )
    } else {
        stopProxy( function () {
            showStatus( '服务已停止' )
            $( '#start' ).removeClass( 'disabled' )
            $( '#port' ).removeAttr( 'readonly' )
        } )
    }

} )

$( '#edit' ).on( 'click', '.clear_all', function ( event ) {
    $( '#editCon' ).val( '' )
} )

$( '.adjust' ).on( 'click', function ( event ) {
    var self = $( this )
    // var midH = $('.mid_w').height()
    // 	,bottomH = $('.bottom_w').height()
    // 	,contentH = $('.content_w').height()
    // var c = 100
    if ( self.hasClass( 'extend' ) ) {
        // $('.mid_w').css('height', midH+c+'px')
        $( '.bottom_w' ).css( 'top', '282px' )
        // $('.content_w').css('height', contentH-c+'px')
        self.removeClass( 'extend' )
    } else {
        // $('.mid_w').css('height', midH-c+'px')
        $( '.bottom_w' ).css( 'top', '82px' )
        // $('.content_w').css('height', contentH+c+'px')
        self.addClass( 'extend' )
    }
} )

$( '.hidePanel' ).on( 'click', function ( event ) {
    $( '#detail' ).hide()
    var $adjust = $( '.adjust' )
    if ( $adjust.hasClass( 'extend' ) ) {
        $adjust.trigger( 'click' )
    }
} )

$( '#find_input' ).on( 'input change', function ( event ) {
    var val = $( this ).val().trim()
    if ( $( this ).data( 'odata' ) == val ) return
    $( this ).data( 'odata', val )
    var reg = new RegExp( '(' + val + ')', "gi" );
    $( '#url li' ).each( function ( index, item ) {
        var ourl       = $( item ).attr( 'ourl' )
            , $wrapper = $( item ).children( '.url_span' )
        $wrapper.html( ourl.replace( reg, '<span class="highlight">$1</span>' ) )
    } )
} )
