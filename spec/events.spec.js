const jetpack = require( "fs-jetpack" );
const nock = require( "nock" );
const chai = require( "chai" );
const should = chai.should();
const chaiAsPromised = require( "chai-as-promised" );
chai.use( chaiAsPromised );
const LeanKitEvents = require( "../src" );
const accountName = "your-account-name";
const email = "your@email.com";
const pwd = "p@ssw0rd";
const proxy = null;

describe( "Events Tests", () => {
	const auth = {
		account: accountName,
		email,
		password: pwd
	};
	let events = {};
	const url = /.*leankit\.com/gi; // "https://your-account-name.leankit.com:443"; // /leankit\.com/; // accountName.startsWith( "http" ) ? accountName : `https://${ accountName }.leankit.com`;
	const boardId = 101;
	const version = 1;

	const testCheckForUpdates = eventType => {
		return events.checkForUpdates().then(
			res => {
				res.should.be.ok;
				res.should.be.instanceOf( Array );
				const e = res.find( ev => {
					return ev.eventType === eventType;
				} );
				should.exist( e );
				e.should.have.property( "eventDateTime" );
				e.should.have.property( "boardVersion" );
			},
			err => {
				should.not.exist( err );
			}
		);
	};

	const testEventEmitter = function( eventType, done ) {
		events.once( eventType, e => {
			events.stop();
			e.should.have.property( "eventType" ).that.is.equal( eventType );
			e.should.have.property( "eventDateTime" );
			e.should.have.property( "boardVersion" ).that.is.equal( 2 );
			done();
		} );
		events.start();
	};

	const mockApiCall = function( mockResponseFile, includeBoardRequest = true ) {
		if ( includeBoardRequest ) {
			nock( url, { encodedQueryParams: true } )
				.get( "/kanban/api/boards/101" )
				.reply( 200, { ReplyData: [ { Version: 1 } ] } );
		}
		const boardEvent = jetpack.read( mockResponseFile, "json" );
		nock( url ).get( "/kanban/api/board/101/boardversion/1/checkforupdates" ).reply( 200, { ReplyCode: 200, ReplyData: [ boardEvent ] } );
		nock( url ).get( "/kanban/api/board/101/boardversion/2/checkforupdates" ).reply( 200, { ReplyCode: 200, ReplyData: [ boardEvent ] } );
	};

	before( () => {
		if ( proxy ) {
			process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
			auth.options = {
				proxy
			};
		}
	} );

	describe( "client constructor", () => {
		const testVersion = 33;
		const testPollInterval = 55;
		const resumeAfterError = false;
		before( () => {
			events = new LeanKitEvents( auth, boardId, testVersion, testPollInterval, resumeAfterError );
		} );

		it( "has the right board version", () => {
			events.version.should.equal( testVersion );
		} );

		it( "has the right polling interval", () => {
			events.pollInterval.should.equal( testPollInterval );
		} );

		it( "resumeAfterError = false", () => {
			events.resumeAfterError.should.equal( false );
		} );
	} );

	describe( "more client constructor", () => {
		const testVersion = 33;
		const testPollInterval = 55;
		const resumeAfterError = true;
		before( () => {
			events = new LeanKitEvents( auth, boardId, testVersion, testPollInterval, resumeAfterError );
		} );

		it( "has the right board version", () => {
			events.version.should.equal( testVersion );
		} );

		it( "has the right polling interval", () => {
			events.pollInterval.should.equal( testPollInterval );
		} );

		it( "resumeAfterError = true", () => {
			events.resumeAfterError.should.equal( true );
		} );
	} );

	describe( "default client constructor", () => {
		const eventType = "activity-types-changed";
		const mockResponseFile = "./spec/test-files/activity-types-changed.json";
		let boardScope = {};

		before( done => {
			// nock.recorder.rec();
			nock.cleanAll();
			nock.disableNetConnect();
			events = new LeanKitEvents( auth, boardId );
			events.on( "error", err => {
				console.log( err );
			} );
			boardScope = nock( url, { encodedQueryParams: true } )
				.get( "/kanban/api/boards/101" )
				.reply( 200, { ReplyData: [ { Version: 1 } ] } );
			mockApiCall( mockResponseFile, false );
			done();
		} );

		after( done => {
			nock.cleanAll();
			done();
		} );

		it( "gets the board to determine the latest board version", done => {
			try {
				events.once( eventType, e => {
					events.stop();
					boardScope.isDone().should.equal( true );
					done();
				} );
				events.start();
			} catch ( err ) {
				console.log( err );
				done();
			}
		} );

		it( "defaults to 30 seconds polling", () => {
			events.pollInterval.should.equal( 30 );
		} );

		it( "defaults to resumeAfterError = true", () => {
			events.resumeAfterError.should.equal( true );
		} );
	} );

	describe( "activity types changed event", () => {
		const eventType = "activity-types-changed";
		const mockResponseFile = "./spec/test-files/activity-types-changed.json";
		before( () => {
			events = new LeanKitEvents( auth, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "checkForUpdates should return correct event", () => {
			return testCheckForUpdates( eventType );
		} );

		it( "should emit correct event", done => {
			testEventEmitter( eventType, done );
		} );
	} );

	describe( "board card types changed event", () => {
		const eventType = "board-card-types-changed";
		const mockResponseFile = "./spec/test-files/board-card-types-changed.json";
		before( () => {
			events = new LeanKitEvents( auth, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "checkForUpdates should return correct event", () => {
			return testCheckForUpdates( eventType );
		} );

		it( "should emit correct event", done => {
			testEventEmitter( eventType, done );
		} );
	} );

	describe( "board edited event", () => {
		const eventType = "board-edit";
		const mockResponseFile = "./spec/test-files/board-edited.json";
		before( () => {
			events = new LeanKitEvents( auth, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "checkForUpdates should return correct event", () => {
			return testCheckForUpdates( eventType );
		} );

		it( "should emit correct event", done => {
			events.once( eventType, e => {
				events.stop();
				e.should.have.property( "eventType" ).that.is.equal( eventType );
				e.should.have.property( "eventDateTime" );
				e.should.have.property( "boardVersion" ).that.is.equal( 2 );
				e.should.have.property( "board" );
				done();
			} );
			events.start();
		} );
	} );

	describe( "card attachment added event", () => {
		const eventType = "attachment-change";
		const mockResponseFile = "./spec/test-files/card-attachment-added.json";
		before( () => {
			events = new LeanKitEvents( auth, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "checkForUpdates should return correct event", () => {
			return testCheckForUpdates( eventType );
		} );

		it( "should emit correct event", done => {
			testEventEmitter( eventType, done );
		} );
	} );

	describe( "card blocked event", () => {
		const eventType = "card-blocked";
		const mockResponseFile = "./spec/test-files/card-blocked.json";
		before( () => {
			events = new LeanKitEvents( auth, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "checkForUpdates should return correct event", () => {
			return testCheckForUpdates( eventType );
		} );

		it( "should emit correct event", done => {
			testEventEmitter( eventType, done );
		} );
	} );

	describe( "card unblocked event", () => {
		const eventType = "card-blocked";
		const mockResponseFile = "./spec/test-files/card-unblocked.json";
		before( () => {
			events = new LeanKitEvents( auth, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "checkForUpdates should return correct event", () => {
			return testCheckForUpdates( eventType );
		} );

		it( "should emit correct event", done => {
			testEventEmitter( eventType, done );
		} );
	} );

	describe( "card comment added event", () => {
		const eventType = "comment-post";
		const mockResponseFile = "./spec/test-files/card-comment-added.json";
		before( () => {
			events = new LeanKitEvents( auth, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "checkForUpdates should return correct event", () => {
			return testCheckForUpdates( eventType );
		} );

		it( "should emit correct event", done => {
			testEventEmitter( eventType, done );
		} );
	} );

	describe( "card created event", () => {
		const eventType = "card-creation";
		const mockResponseFile = "./spec/test-files/card-created.json";
		before( () => {
			events = new LeanKitEvents( auth, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "checkForUpdates should return correct event", () => {
			return testCheckForUpdates( eventType );
		} );

		it( "should emit correct event", done => {
			testEventEmitter( eventType, done );
		} );
	} );

	describe( "card deleted event", () => {
		const eventType = "card-deleted";
		const mockResponseFile = "./spec/test-files/card-deleted.json";
		before( () => {
			events = new LeanKitEvents( auth, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "checkForUpdates should return correct event", () => {
			return testCheckForUpdates( eventType );
		} );

		it( "should emit correct event", done => {
			testEventEmitter( eventType, done );
		} );
	} );

	describe( "card fields changed event", () => {
		const eventType = "card-fields-changed";
		const mockResponseFile = "./spec/test-files/card-fields-changed.json";
		before( () => {
			events = new LeanKitEvents( auth, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "checkForUpdates should return correct event", () => {
			return testCheckForUpdates( eventType );
		} );

		it( "should emit correct event", done => {
			testEventEmitter( eventType, done );
		} );
	} );

	describe( "card moved from board event", () => {
		const eventType = "card-move-from-board";
		const mockResponseFile = "./spec/test-files/card-moved-from-board.json";
		before( () => {
			events = new LeanKitEvents( auth, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "checkForUpdates should return correct event", () => {
			return testCheckForUpdates( eventType );
		} );

		it( "should emit correct event", done => {
			testEventEmitter( eventType, done );
		} );
	} );

	describe( "card moved to board event", () => {
		const eventType = "card-move-to-board";
		const mockResponseFile = "./spec/test-files/card-moved-to-board.json";
		before( () => {
			events = new LeanKitEvents( auth, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "checkForUpdates should return correct event", () => {
			return testCheckForUpdates( eventType );
		} );

		it( "should emit correct event", done => {
			testEventEmitter( eventType, done );
		} );
	} );

	describe( "card moved event", () => {
		const eventType = "card-move";
		const mockResponseFile = "./spec/test-files/card-moved.json";
		before( () => {
			events = new LeanKitEvents( auth, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "checkForUpdates should return correct event", () => {
			return testCheckForUpdates( eventType );
		} );

		it( "should emit correct event", done => {
			testEventEmitter( eventType, done );
		} );
	} );

	describe( "card multiple user assignments event", () => {
		const eventType = "user-assignment";
		const mockResponseFile = "./spec/test-files/card-multiple-user-assignments.json";
		before( () => {
			events = new LeanKitEvents( auth, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "checkForUpdates should return correct event", () => {
			return testCheckForUpdates( eventType );
		} );

		it( "should emit correct event", done => {
			testEventEmitter( eventType, done );
		} );
	} );

	describe( "card user assigned event", () => {
		const eventType = "user-assignment";
		const mockResponseFile = "./spec/test-files/card-user-assigned.json";
		before( () => {
			events = new LeanKitEvents( auth, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "checkForUpdates should return correct event", () => {
			return testCheckForUpdates( eventType );
		} );

		it( "should emit correct event", done => {
			testEventEmitter( eventType, done );
		} );
	} );

	describe( "card user unassigned event", () => {
		const eventType = "user-assignment";
		const mockResponseFile = "./spec/test-files/card-user-unassigned.json";
		before( () => {
			events = new LeanKitEvents( auth, boardId, version );
			mockApiCall( mockResponseFile );
		} );

		after( () => {
			nock.cleanAll();
		} );

		it( "checkForUpdates should return correct event", () => {
			return testCheckForUpdates( eventType );
		} );

		it( "should emit correct event", done => {
			testEventEmitter( eventType, done );
		} );
	} );
} );
