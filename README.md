## LeanKit Events for Node.js

The LeanKit Events for Node.js provides an easy-to-use set of functions designed to simplify the integration of external systems and utilities with your LeanKit account. This module is for subscribing to events, such as when cards are created, moved, assigned, and so forth.

To access specific LeanKit APIs from Node.js, see the [LeanKit Node.js Client](https://github.com/LeanKit/leankit-node-client).

### Requirements

* [Node.js](http://nodejs.org) 4.x or higher
* A [LeanKit](http://leankit.com) account

### Installing the client

```
npm install leankit-events
```

### Subscribe to events

The LeanKit Client includes a module for monitoring a board for events, such as when cards are created, moved, assigned, and so forth.

**Events usage**

```
const LeanKitEvents = require( "leankit-events" );
const events = new LeanKitEvents( auth, boardId [, version] [, pollInterval] [, resumeAfterError] );
events.on( "event-name", function( e ) {
	// Do something with the event
} );
events.start();
```

**Constructor options**

|Parameter|Description|
|:---|:---|
|`auth`|A JavaScript object with `account`, `email`, and `password` properties. An additional `options` property may be used for proxy support. See proxy section below.|
|`boardId`|The ID of the LeanKit Board to subscribe to.|
|`version`|Optional Board version number. If events have occurred since the given `version`, those will be returned immediately.|
|`pollInterval`|Optional polling interval in seconds. The default is 30 seconds.|
|`resumeAfterError`|Optional handling of errors. If an error occurs with `resumeAfterError = false` the client will stop polling for changes. The default is `true`.|

**Sample**

```
const LeanKitEvents = require( "leankit-events" );
const auth = { account: "account-name", email: "your@email.com", password: "your-p@ssw0rd" };
const boardId = 445566789; // The board ID to subscribe to
const events = new LeanKitEvents( auth, boardId );
events.on( "card-creation", function( e ) {
	console.log( e );
} );
events.start();
```

**Sample output when a card is added to the subscribed board:**

```
{ cardId: 123456789,
  eventType: 'card-creation',
  eventDateTime: '11/06/2015 03:38:05 PM',
  message: 'David Neal created the Card [Sample Card 1] within Lane [ToDo].',
  toLaneId: 456789123,
  fromLaneId: null,
  requiresBoardRefresh: false,
  isBlocked: false,
  blockedComment: null,
  userId: 62984826,
  assignedUserId: 0,
  isUnassigning: false,
  commentText: null,
  wipOverrideComment: null,
  wipOverrideLane: 0,
  wipOverrideUser: 0,
  taskboardParentCardId: 0,
  taskboardId: 0,
  boardVersion: 2 }
```


**Card events**

|Event|Description|
|:---|:---|
|`card-creation`|Occurs when a new card is added to a board.|
|`card-move`|Occurs when a card is moved on the board.|
|`card-fields-changed`|Occurs when a card's fields are modified (e.g. Title, Description, and so forth)|
|`comment-post`|Occurs when a user posts a comment on a card.|
|`user-assignment`|Occurs when users are assigned or unassigned from a card. Check the `isUnassigning` property to know whether the user is being assigned or unassigned.|
|`attachment-change`|Occurs when an attachment is added to a card.|
|`card-blocked`|Occurs when a card is blocked or unblocked. Check the `isBlocked` property to know whether the card was blocked or unblocked.|
|`card-move-from-board`|Occurs when a card is moved from the board being monitored to another board.|
|`card-move-to-board`|Occurs when a card is moved from another board to the board being monitored.|
|`card-deleted`|Occurs when a card is deleted.|

**Board events**

|Event|Description|
|:---|:---|
|`board-edit`|Occurs when the board layout/structure is modified.|
|`activity-types-changed` |Occurs when custom icons are modified.|
|`board-card-types-changed`|Occurs when card types for the board are modified.|

### Proxy support

To use the LeanKit Events behind a proxy server, include an `options` object in the authentication argument that includes the proxy server. For example:

```
const LeanKitEvents = require( "leankit-events" );
const auth = {
	account: "account-name",
	email: "your@email.com",
	password: "your-p@ssw0rd",
	options: {
		proxy: "http://localproxy.com"
	}
};

const events = new LeanKitEvents( auth, 123456789 );
```

This `options` object is the same object used by the [request module](https://github.com/mikeal/request#requestoptions-callback).

### Questions?

Visit [support.leankit.com](http://support.leankit.com).

### License

The LeanKit Node Client is licensed under [MIT](http://www.opensource.org/licenses/mit-license.php). Refer to [license.txt](https://github.com/LeanKit/leankit-node-client/blob/master/License.txt) for more information.
