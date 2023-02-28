import React, { useState, useRef } from 'react'
import Link from 'next/link'
import { useQuery, useMutation } from '../convex/_generated/react'
import { Avatar } from './login'
import { FileAttachment } from '../convex/listFiles'
import { showTimeAgo } from './comments'
import type { FormEvent } from 'react'
import { Id, type Document } from '../convex/_generated/dataModel'

function showFileSize(size: number) {
  if (size < 1024) return `${Math.round(size)} B`
  const kb = size / 1024
  if (kb < 1024) return `${Math.round(kb)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${Math.round(mb)} MB`
  const gb = kb / 1024
  return `${Math.round(gb)} GB`
}

function showFileType(type: string) {
  switch (type.split('/')[0]) {
    case 'image':
      return '🖼️'
    case 'video':
      return '📼'
    case 'text':
      return '📄'
    default:
      return '📎'
  }
}

function FileListing({
  file,
  user,
  handleDeleteFile,
}: {
  file: FileAttachment
  user?: Document<'users'> | null
  handleDeleteFile: (id: Id<'files'>) => void
}) {
  const { _id, _creationTime, name, type, author, url, size } = file
  const created = new Date(_creationTime)
  const isFileAuthor = user && user._id.equals(author._id)
  return (
    <li key={_id.toString()} className="file">
      <div
        style={{
          width: '90%',
          marginRight: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          overflowWrap: 'anywhere',
        }}
      >
        <div style={{ flexGrow: 2, marginRight: '16px' }}>
          <span>{showFileType(type)}</span>
          <Link href={url} target="_blank">
            {name}
          </Link>
          <span> ({showFileSize(size)})</span>
        </div>
        <div style={{ flexShrink: 0 }}>
          {isFileAuthor && (
            <button
              className="icon-button"
              title="Delete file"
              onClick={() => handleDeleteFile(_id)}
            >
              🗑️
            </button>
          )}
          {/* <button className="icon-button" title="Download file">
            ⬇️
          </button> */}
        </div>
      </div>
      <span>
        <Avatar user={author} size={20} />
      </span>
      <span title={created.toLocaleString()}>{showTimeAgo(created)}</span>
    </li>
  )
}

function FileUploading({
  fileName,
  fileType,
  author,
}: {
  fileName: string
  fileType: string
  author: Document<'users'>
}) {
  return (
    <li key={fileName} className="file">
      <div
        style={{
          width: '90%',
          marginRight: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          overflowWrap: 'anywhere',
        }}
      >
        <div style={{ flexGrow: 2, marginRight: '16px' }}>
          <span>{showFileType(fileType)}</span>
          <Link href={'#'}>{fileName}</Link>
          <span> (uploading...)</span>
        </div>
        <div style={{ flexShrink: 0 }}></div>
      </div>
      <span>
        <Avatar user={author} size={20} />
      </span>
      <span>...</span>
    </li>
  )
}

export function Files({
  user,
  taskId,
}: {
  user?: Document<'users'> | null
  taskId: Id<'tasks'>
}) {
  const files = useQuery('listFiles', taskId)
  const generateUploadUrl = useMutation('saveFile:generateUploadUrl')
  const saveFile = useMutation('saveFile')

  const [uploading, setUploading] = useState({ name: '', type: '' })
  const fileInput = useRef<HTMLInputElement>(null)

  const deleteFile = useMutation('deleteFile')
  const handleDeleteFile = async function (fileId: Id<'files'>) {
    await deleteFile(fileId)
  }

  async function handleUploadFile(event: FormEvent) {
    event.preventDefault()
    const { files } = event.target as HTMLInputElement
    if (!files || files.length !== 1)
      throw new Error('Select exactly one file to upload')

    const newFile = files[0]
    if (fileInput.current) fileInput.current.value = ''

    // we should never end up here, but just in case
    if (!newFile) throw new Error('No file selected for upload')
    setUploading({ name: newFile.name, type: newFile.type })

    // Step 1: Get a short-lived upload URL
    const postUrl = await generateUploadUrl()

    // Step 2: POST the file to the URL
    const result = await fetch(postUrl, {
      method: 'POST',
      headers: { 'Content-Type': newFile.type },
      body: newFile,
    })
    const { storageId } = await result.json()

    await saveFile(taskId, storageId, newFile.name, newFile.type)
    setUploading({ name: '', type: '' })
  }

  return (
    <div>
      <ul className="files">
        {files &&
          files.map((file, i) => (
            <FileListing
              key={i}
              file={file}
              user={user}
              handleDeleteFile={handleDeleteFile}
            />
          ))}
        {user && uploading.name && (
          <FileUploading
            fileName={uploading.name}
            fileType={uploading.type}
            author={user}
          />
        )}
      </ul>
      {user && (
        <form
          style={{
            display: 'flex',
            justifyContent: 'left',
            margin: '8px 16px',
          }}
        >
          <label
            htmlFor="upload"
            className="pill-button"
            style={{ height: '1.5em' }}
          >
            + Upload file
          </label>
          <input
            id="upload"
            type="file"
            style={{ opacity: 0 }}
            onChange={handleUploadFile}
            ref={fileInput}
          />
        </form>
      )}
    </div>
  )
}
