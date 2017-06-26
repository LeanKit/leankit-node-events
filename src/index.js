/* eslint-disable max-lines */
const leanKitClient = require( "leankit-client" );
const EventEmitter = require( "events" ).EventEmitter;
const changeCase = require( "change-case" );
const MS = 1000;
const DEFAULT_POLL_INTERVAL = 30;

const camelClone = obj => {
	const clone = {};
	for ( const key in obj ) { // eslint-disable-line guard-for-in
		let val = obj[ key ];
		if ( val && typeof val === "object" ) {
			val = camelClone( val );
		}
		clone[ changeCase.camel( key ) ] = val;
	}
	return clone;
};

module.exports = class LeanKitNotifier extends EventEmitter {
	constructor( { account, email, password, options }, boardId, version = 0, pollInterval = DEFAULT_POLL_INTERVAL, resumeAfterError = true ) {
		super();
		this.timer = 0;
		this.client = leanKitClient( { account, email, password, config: options } );
		this.boardId = boardId;
		this.version = version;
		this.pollInterval = pollInterval;
		this.resumeAfterError = resumeAfterError;
	}

	scheduleNextPoll() {
		if ( this.timer === 0 ) {
			super.emit( "debug", "scheduling next poll" );
			this.timer = setTimeout( () => {
				super.emit( "debug", "scheduled poll starting..." );
				return this.getUpdates();
			}, this.pollInterval * MS );
		}
		return this.timer;
	}

	setBoardVersion( boardRes ) {
		super.emit( "debug", `current board version: ${ boardRes.data.Version }` );
		this.version = boardRes.data.Version;
		this.getUpdates();
	}

	emitEvents( events ) {
		super.emit( "debug", `events: ${ events.length }` );
		if ( events && events.length > 0 ) {
			events.forEach( e => {
				super.emit( e.eventType, e );
			} );
		}
		this.scheduleNextPoll();
	}

	eventError( err ) {
		super.emit( "error", err );
		if ( this.resumeAfterError ) {
			this.scheduleNextPoll();
		}
	}

	processEventResponse( res ) {
		const events = [];
		const data = res.data;
		super.emit( "debug", `client.getBoardUpdates, hasUpdates: ${ data.HasUpdates }` );
		if ( data.HasUpdates ) {
			super.emit( "debug", `client.getBoardUpdates, events: ${ data.Events.length }` );
			this.version = data.CurrentBoardVersion;
			data.Events.forEach( e => {
				const n = camelClone( e );
				n.boardVersion = this.version;
				n.eventType = changeCase.param( e.EventType ).replace( "-event", "" );
				if ( n.eventType === "board-edit" && data.NewPayload ) {
					n.board = camelClone( data.NewPayload );
				}
				events.push( n );
			} );
		}
		return events;
	}

	checkForUpdates() {
		super.emit( "debug", "calling client.getBoardUpdates..." );
		return this.client.v1.board.since.version.updates( this.boardId, this.version )
			.then( res => this.processEventResponse( res ) );
	}

	getUpdates() {
		this.timer = 0;
		if ( !this.version ) {
			super.emit( "debug", "no board version specified, getting current board" );
			this.client.v1.board.get( this.boardId )
				.then( res => this.setBoardVersion( res ) )
				.catch( err => this.eventError( err ) );
			return null;
		}
		super.emit( "polling", { id: this.boardId, version: this.version } );
		this.checkForUpdates()
			.then( events => this.emitEvents( events ) )
			.catch( err => this.eventError( err ) );
		return null;
	}

	start() {
		super.emit( "debug", "starting event polling..." );
		return this.getUpdates();
	}

	stop() {
		super.emit( "debug", "stopping event polling..." );
		if ( this.timer ) {
			super.emit( "debug", "clearing timer..." );
			clearTimeout( this.timer );
			this.timer = 0;
		}
	}

};
