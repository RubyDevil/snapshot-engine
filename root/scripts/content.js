removeEventListener("keydown", window.Snapshot?.eventHandler);

class Snapshot {
   static snapshots = [];
   static target = null;
   static maxDepth = 5;
   static showPreoperationLogs = false;

   /**
    * @param  {...any} args The arguments to log
    */
   static log(...args) {
      return console.log(
         "%cSnapshot Engine",
         "background-color: #001926; color: #2089e5; border: 1px solid #2089e5; padding: 1px 2px; font-family: 'Lucida Console', 'Courier New', monospace;",
         ...args
      );
   }

   /**
    * @param {string} message The message to log
    * @param {...any} args Additional arguments to log
    */
   static error(message, ...args) {
      return console.log(
         "%cSnapshot Engine%c " + message,
         "background-color: #001926; color: #2089e5; border: 1px solid #2089e5; padding: 1px 2px; font-family: 'Lucida Console', 'Courier New', monospace;",
         "background-color: unset; color: #ff0000; border: unset; padding: unset; font-family: 'Lucida Console', 'Courier New', monospace;",
         ...args
      );
   }

   /**
    * @param {object} obj The object to create a snapshot of
    */
   static create(obj) {
      if (obj === null || typeof obj !== "object") return obj;
      const pastObjects = []; // [original, copy][]
      let maxDepth = 0, propertiesCaptured = 0;
      const snapshot = recursiveCreateSnapshot(obj);
      return { snapshot, maxDepth, propertiesCaptured };
      function recursiveCreateSnapshot(obj, depth = 0) {
         if (depth > Snapshot.maxDepth) return null;
         else maxDepth = Math.max(maxDepth, depth);
         const cached = pastObjects.find(([original, copy]) => original === obj);
         if (cached) return cached[1];
         const copy = Array.isArray(obj) ? [] : {};
         pastObjects.push([obj, copy]);
         for (const [key, value] of Object.entries(obj)) {
            propertiesCaptured++;
            if (["number", "string", "boolean", "symbol", "undefined", "function", "bigint"].includes(typeof value) || value === null) {
               copy[key] = value;
            } else if (typeof value === "object") {
               copy[key] = recursiveCreateSnapshot(value, depth + 1);
            }
         }
         return copy;
      }
   }

   /**
    * @param {object} obj1 The first object
    * @param {object} obj2 The second object
    */
   static compare(obj1, obj2) {
      if (obj1 === null || obj2 === null) return [];
      const changes = [];
      let maxDepth = 0, propertiesChecked = 0;
      recursiveCompareObjects(obj1, obj2);
      return { changes, maxDepth, propertiesChecked };
      function recursiveCompareObjects(obj1, obj2, path = "", depth = 0) {
         if (depth > Snapshot.maxDepth) return;
         else maxDepth = Math.max(maxDepth, depth);
         for (const key of Object.keys(obj1)) {
            propertiesChecked++;
            const newPath = (Array.isArray(obj1) || obj1 instanceof Array)
               ? (path ? `${path}[${key}]` : `[${key}]`)
               : (path ? `${path}.${key}` : key);
            const [value1, value2] = [obj1[key], obj2[key]];
            if (value1 && value2 && typeof value1 === "object" && typeof value2 === "object") {
               recursiveCompareObjects(value1, value2, newPath, depth + 1);
            } else if (value1 !== value2 && ![value1, value2].every(value => typeof value === "number" && isNaN(value))) {
               changes.push([newPath, value1, value2]);
            }
         }
      }
   }

   /**
    * @param {KeyboardEvent} e The event object
    */
   static eventHandler = (e) => {
      if (e.altKey && e.code === "Digit1") {
         const target = Snapshot.target ?? window.temp1;
         if (!target) return Snapshot.error("No target found.", "\nSet target with \"Snapshot.target = <target>\".\nOr set target by clicking \"Save as global variable\" on any object.");
         if (Snapshot.showPreoperationLogs) Snapshot.log("Taking snapshot...");
         const snapshotStart = performance.now();
         const operation = Snapshot.create(target);
         const snapshotEnd = performance.now();
         Snapshot.snapshots.push({
            timestamp: Date.now(),
            snapshot: operation.snapshot
         });
         Snapshot.log(
            "Snapshot created",
            "\nDuration:", Math.round((snapshotEnd - snapshotStart) * 10000) / 10000, "ms",
            "\nMax depth:", operation.maxDepth,
            "\nProperties captured:", operation.propertiesCaptured,
            "\nTotal snapshots:", Snapshot.snapshots.length
         );
      } else if (e.altKey && e.code === "Digit2") {
         const snapshotCount = Snapshot.snapshots.length;
         Snapshot.snapshots = [];
         Snapshot.log("Snapshots cleared", "\nSnapshots removed:", snapshotCount);
      } else if (e.altKey && e.code === "Digit3") {
         if (Snapshot.showPreoperationLogs) Snapshot.log("Comparing snapshots...");
         const snapshotCount = Snapshot.snapshots.length;
         if (snapshotCount < 2) return Snapshot.error("Not enough snapshots to compare.");
         const compareStart = performance.now();
         const operation = Snapshot.compare(Snapshot.snapshots[snapshotCount - 2].snapshot, Snapshot.snapshots[snapshotCount - 1].snapshot);
         const compareEnd = performance.now();
         Snapshot.log(
            "Comparison complete",
            "\nDuration:", Math.round((compareEnd - compareStart) * 1000) / 1000, "ms",
            "\nTime difference:", (Snapshot.snapshots[snapshotCount - 1].timestamp - Snapshot.snapshots[snapshotCount - 2].timestamp), "ms",
            "\nCompared snapshots:", `#${snapshotCount - 2} and #${snapshotCount - 1}`,
            "\nMax depth:", operation.maxDepth,
            "\nProperties checked:", operation.propertiesChecked,
            "\nChanges found:", operation.changes.length,
            "\n", operation.changes
         );
      }
   }
}

addEventListener("keydown", Snapshot.eventHandler);

window.Snapshot = Snapshot;

Snapshot.log(
   "\nPress Alt + 1 to take snapshot",
   "\nPress Alt + 2 to clear snapshots",
   "\nPress Alt + 3 to compare snapshots",
   "\nNote: Make sure to have focus on the webpage and not the console for the shortcuts to work."
);