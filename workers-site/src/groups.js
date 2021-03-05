import {
  createPlaylist,
  getPlaylistsForGroup,
  updatePlaylistForUser,
} from './playlists'
import { saveSongsForUserWeekly } from './songs'

export const groupnameToKVName = groupname => {
  return groupname.replaceAll(' ', '-').toLowerCase()
}

export const createUpdateGroup = async (groupname, newUserIds = []) => {
  let groupKVName = groupnameToKVName(groupname)
  let group = await getGroup(groupKVName)
  let userIds = newUserIds
  if (group) {
    group.userIds.forEach(id => {
      if (!newUserIds.includes(id)) {
        userIds.push(id)
      }
    })
  }
  let updatedGroup = {
    name: groupname,
    userIds,
  }
  await MYLES_TODOS.put(`groups:${groupKVName}`, JSON.stringify(updatedGroup))
  await Promise.all(
    newUserIds.map(id => backDateGroupPlaylist(groupname, id, updatedGroup)),
  )
}

export const getGroup = async groupname => {
  let groupKVName = groupnameToKVName(groupname)
  return MYLES_TODOS.get(`groups:${groupKVName}`, 'json')
}

// TODO: handle pagination
const getLastGroupSongsNumber = async groupname => {
  let groupKVName = groupnameToKVName(groupname)
  let list = await MYLES_TODOS.list({ prefix: `groups:${groupKVName}:songs:` })
  return list.keys.length
}

const backDateGroupPlaylist = async (groupname, userId, group = null) => {
  let groupKVName = groupnameToKVName(groupname)
  let existingPlaylist = await MYLES_TODOS.get(
    `${groupKVName}:${userId}:playlist`,
  )
  let playlistId
  if (existingPlaylist) {
    playlistId = existingPlaylist.id
  } else {
    let newPlaylist = await createPlaylist(
      group === null ? await getGroup(groupname) : group,
      userId,
    )
    playlistId = newPlaylist.id
  }
  let songUris = await MYLES_TODOS.get(
    `groups:${groupKVName}:songs:${await getLastGroupSongsNumber(groupname)}`,
    'json',
  )

  if (songUris) {
    await updatePlaylistForUser(userId, playlistId, songUris)
  }
}

export const updateGroupsPlaylists = async groupname => {
  let groupKVName = groupnameToKVName(groupname)
  let playlists = await getPlaylistsForGroup(groupname)
  let songUrisArr = await Promise.all(
    playlists.map(({ userId }) => saveSongsForUserWeekly(userId)),
  )
  let userIdToUris = songUrisArr.reduce((obj, arr, i) => {
    obj[playlists[i].userId] = arr
    return obj
  }, {})

  await MYLES_TODOS.put(
    `groups:${groupKVName}:songs:${(await getLastGroupSongsNumber(groupname)) +
      1}`,
    JSON.stringify(songUrisArr.flat()),
  )

  await Promise.all(
    playlists.map(playlist =>
      updatePlaylistForUser(
        playlist.userId,
        playlist.id,
        Object.keys(userIdToUris)
          .filter(k => k !== playlist.userId)
          .map(username => userIdToUris[username])
          .flat(),
      ),
    ),
  )
}
