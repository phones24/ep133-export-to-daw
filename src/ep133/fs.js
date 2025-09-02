// This file was obtained from the original sources owned by Teenage Engineering
// and is NOT covered by the GNU Affero General Public License that applies to the rest of the project.

import {
  TE_SYSEX_FILE_CAPABILITY_DELETE,
  TE_SYSEX_FILE_CAPABILITY_MOVE,
  TE_SYSEX_FILE_CAPABILITY_PLAYBACK,
  TE_SYSEX_FILE_CAPABILITY_READ,
  TE_SYSEX_FILE_CAPABILITY_WRITE,
  TE_SYSEX_FILE_FILE_TYPE_FILE,
} from './constants';

export const FileType = {
  File: 1,
  Directory: 2,
};

export class FSNode {
  constructor(id, parentId, name, flags, size) {
    this.id = id;
    this.parentId = parentId;
    this.name = name;
    this.flags = flags;
    this.size = size;
  }

  get type() {
    // 1 = file, 2 = folder
    return this.flags & TE_SYSEX_FILE_FILE_TYPE_FILE ? 1 : 2;
  }

  get isReadable() {
    return !!(this.flags & TE_SYSEX_FILE_CAPABILITY_READ);
  }

  get isWritable() {
    return !!(this.flags & TE_SYSEX_FILE_CAPABILITY_WRITE);
  }

  get isDeletable() {
    return !!(this.flags & TE_SYSEX_FILE_CAPABILITY_DELETE);
  }

  get isMovable() {
    return !!(this.flags & TE_SYSEX_FILE_CAPABILITY_MOVE);
  }

  get isPlayable() {
    return !!(this.flags & TE_SYSEX_FILE_CAPABILITY_PLAYBACK);
  }
}

export class FSFile extends FSNode {
  constructor(id, parentId, name, flags, size, path) {
    super(id, parentId, name, flags, size);
    this.path = path;
  }
}

export class FSFolder extends FSNode {
  constructor(id, parentId, name, flags, path) {
    super(id, parentId, name, flags, 0); // folders have size = 0
    this.path = path;
    this.children = [];
  }

  addChild(childNode) {
    this.children.push(childNode);
  }
}
