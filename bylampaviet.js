(function () {
    'use strict';

function addonStart() {

/*
 * * * Biểu tượng cho các phần của plugin
 */
var icon_add_plugin= '<svg version="1.1" id="_x32_" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="256px" height="256px" viewBox="0 0 512 512" xml:space="preserve" fill="currentColor"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <style type="text/css"> .st0{fill:currentColor;} </style> <g> <path class="st0" d="M432.531,229.906c-9.906,0-19.125,2.594-27.313,6.375v-51.656c0-42.938-34.922-77.875-77.859-77.875h-51.641 c3.781-8.156,6.375-17.375,6.375-27.281C282.094,35.656,246.438,0,202.625,0c-43.828,0-79.484,35.656-79.484,79.469 c0,9.906,2.594,19.125,6.359,27.281H77.875C34.938,106.75,0,141.688,0,184.625l0.047,23.828H0l0.078,33.781 c0,23.031,8.578,36.828,12.641,42.063c12.219,15.797,27.094,18.172,34.891,18.172c11.953,0,23.141-4.953,33.203-14.703l0.906-0.422 l1.516-2.141c1.391-1.359,6.328-5.484,14.016-5.5c16.344,0,29.656,13.297,29.656,29.672c0,16.344-13.313,29.656-29.672,29.656 c-7.672,0-12.609-4.125-14-5.5l-1.516-2.141l-0.906-0.422c-10.063-9.75-21.25-14.703-33.203-14.703 c-7.797,0.016-22.672,2.375-34.891,18.172c-4.063,5.25-12.641,19.031-12.641,42.063L0,410.281h0.047L0,434.063 C0,477.063,34.938,512,77.875,512h54.563v-0.063l3.047-0.016c23.016,0,36.828-8.563,42.063-12.641 c15.797-12.219,18.172-27.094,18.172-34.891c0-11.953-4.953-23.141-14.688-33.203l-0.438-0.906l-2.125-1.516 c-1.375-1.391-5.516-6.328-5.516-14.016c0-16.344,13.313-29.656,29.672-29.656c16.344,0,29.656,13.313,29.656,29.656 c0,7.688-4.141,12.625-5.5,14.016l-2.125,1.516l-0.438,0.906c-9.75,10.063-14.703,21.25-14.703,33.203 c0,7.797,2.359,22.672,18.172,34.891c5.25,4.078,19.031,12.641,42.063,12.641l17,0.047V512h40.609 c42.938,0,77.859-34.938,77.859-77.875v-51.641c8.188,3.766,17.406,6.375,27.313,6.375c43.813,0,79.469-35.656,79.469-79.484 C512,265.563,476.344,229.906,432.531,229.906z M432.531,356.375c-19.031,0-37.469-22.063-37.469-22.063 c-3.344-3.203-6.391-4.813-9.25-4.813c-2.844,0-5.469,1.609-7.938,4.813c0,0-5.125,5.891-5.125,19.313v80.5 c0,25.063-20.313,45.391-45.391,45.391h-23.813l-33.797-0.078c-15.438,0-22.188-5.875-22.188-5.875 c-3.703-2.859-5.563-5.875-5.563-9.172c0-3.266,1.859-6.797,5.563-10.594c0,0,17.219-13.891,17.219-39.047 c0-34.313-27.844-62.156-62.156-62.156c-34.344,0-62.156,27.844-62.156,62.156c0,25.156,17.219,39.047,17.219,39.047 c3.688,3.797,5.531,7.328,5.531,10.594c0,3.297-1.844,6.313-5.531,9.172c0,0-6.766,5.875-22.203,5.875l-33.797,0.078H77.875 c-25.063,0-45.375-20.328-45.375-45.391l0.094-48.203h-0.047l0.016-9.422c0-15.422,5.875-22.203,5.875-22.203 c2.859-3.703,5.875-5.531,9.156-5.531s6.813,1.828,10.609,5.531c0,0,13.891,17.234,39.047,17.234 c34.313-0.016,62.156-27.844,62.156-62.156c-0.016-34.344-27.844-62.156-62.156-62.156c-25.156,0-39.047,17.219-39.047,17.219 c-3.797,3.688-7.328,5.531-10.609,5.531s-6.297-1.828-9.156-5.531c0,0-5.875-6.781-5.875-22.203v-1.156h0.031L32.5,184.625 c0-25.063,20.313-45.375,45.375-45.375h80.5c13.422,0,19.313-5.125,19.313-5.125c6.422-4.938,6.422-10.531,0-17.188 c0,0-22.063-18.438-22.063-37.469c0-25.953,21.047-46.984,47-46.984c25.938,0,46.984,21.031,46.984,46.984 c0,19.031-22.047,37.469-22.047,37.469c-6.438,6.656-6.438,12.25,0,17.188c0,0,5.875,5.125,19.281,5.125h80.516 c25.078,0,45.391,20.313,45.391,45.375v80.516c0,13.422,5.125,19.297,5.125,19.297c2.469,3.219,5.094,4.813,7.938,4.813 c2.859,0,5.906-1.594,9.25-4.813c0,0,18.438-22.047,37.469-22.047c25.938,0,46.969,21.047,46.969,46.984 C479.5,335.344,458.469,356.375,432.531,356.375z"></path> </g> </g></svg>'
var icon_add_interface_plugin = '<div class="settings-folder" style="padding:0!important"><div style="width:1.8em;height:1.3em;padding-right:.5em"><svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24"><path fill="currentColor" d="M18 8a2 2 0 1 1-4 0a2 2 0 0 1 4 0"/><path fill="currentColor" fill-rule="evenodd" d="M11.943 1.25h.114c2.309 0 4.118 0 5.53.19c1.444.194 2.584.6 3.479 1.494c.895.895 1.3 2.035 1.494 3.48c.19 1.411.19 3.22.19 5.529v.088c0 1.909 0 3.471-.104 4.743c-.104 1.28-.317 2.347-.795 3.235q-.314.586-.785 1.057c-.895.895-2.035 1.3-3.48 1.494c-1.411.19-3.22.19-5.529.19h-.114c-2.309 0-4.118 0-5.53-.19c-1.444-.194-2.584-.6-3.479-1.494c-.793-.793-1.203-1.78-1.42-3.006c-.215-1.203-.254-2.7-.262-4.558Q1.25 12.792 1.25 12v-.058c0-2.309 0-4.118.19-5.53c.194-1.444.6-2.584 1.494-3.479c.895-.895 2.035-1.3 3.48-1.494c1.411-.19 3.22-.19 5.529-.19m-5.33 1.676c-1.278.172-2.049.5-2.618 1.069c-.57.57-.897 1.34-1.069 2.619c-.174 1.3-.176 3.008-.176 5.386v.844l1.001-.876a2.3 2.3 0 0 1 3.141.104l4.29 4.29a2 2 0 0 0 2.564.222l.298-.21a3 3 0 0 1 3.732.225l2.83 2.547c.286-.598.455-1.384.545-2.493c.098-1.205.099-2.707.099-4.653c0-2.378-.002-4.086-.176-5.386c-.172-1.279-.5-2.05-1.069-2.62c-.57-.569-1.34-.896-2.619-1.068c-1.3-.174-3.008-.176-5.386-.176s-4.086.002-5.386.176" clip-rule="evenodd"/></svg></div><div style="font-size:1.3em">Giao diện</div></div>'
var icon_add_management_plugin = '<div class="settings-folder" style="padding:0!important"><div style="width:1.8em;height:1.3em;padding-right:.5em"><svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 1024 1024"><path fill="currentColor" d="m960.496 415.056l-82.129-18.224c-6.4-20.48-14.784-40.08-24.4-58.927l44.431-74.032c16.592-26.512 24.976-65.52 0-90.512l-45.28-45.248c-24.976-24.992-67.151-20.496-92.623-2.832l-72.032 45.887c-18.689-9.696-38.225-18-58.529-24.56l-18.431-83.12C605.999 33.009 579.343 0 543.999 0h-64c-35.344 0-57.008 33.504-64 64l-20.528 82.128c-21.68 6.912-42.496 15.744-62.336 26.208l-73.84-47.024c-25.456-17.664-67.648-22.16-92.624 2.832l-45.264 45.248c-24.992 25.008-16.608 64 0 90.512l46.752 77.92c-8.767 17.664-16.544 35.936-22.544 55.024l-82.112 18.224C33.007 420.56 0 447.216 0 482.56v64c0 35.344 33.504 57.008 64 64l83.152 20.784c5.745 17.632 12.928 34.56 21.056 50.976l-46.8 78c-16.591 26.496-24.975 65.504 0 90.496l45.28 45.248c24.976 25.008 67.152 20.496 92.624 2.847l74-47.152c19.952 10.528 40.88 19.44 62.704 26.337L416.495 960c7.008 30.496 28.656 64 64 64h64c35.344 0 62-33.007 67.504-63.504l18.464-83.343c20.096-6.496 39.376-14.689 57.84-24.257l72.192 46c25.472 17.664 67.664 22.16 92.624-2.848L898.4 850.8c24.976-25.008 16.592-64 0-90.496l-44.463-74.128c8.944-17.568 16.688-35.84 22.912-54.848L960 610.56c30.496-7.008 64-28.656 64-64v-64c0-35.344-32.992-62-63.504-67.504m-.465 126.992c-2.72 1.952-7.842 4.635-14.338 6.139l-118.656 29.631l-11.008 33.632c-4.975 15.153-11.407 30.529-19.119 45.712l-16.064 31.569l62.688 104.528c4 6.4 5.872 12.127 6.432 15.503l-42.096 42.033c-4.064-1.28-8.688-2.945-10.912-4.464l-105.344-67.184l-32.752 16.945c-15.776 8.192-31.969 14.976-48.097 20.192l-34.88 11.28l-26.368 119.12c-1.216 6.368-4.624 11.504-6.96 13.344h-57.6c-1.951-2.72-4.623-7.84-6.112-14.32L449.39 827.9l-34.095-10.817c-17.569-5.536-35.088-12.912-52.144-21.904l-32.912-17.376l-105.36 67.152c-4.304 2.912-8.912 4.56-13.088 4.56l-41.968-40.847c.56-3.311 2.304-8.783 5.792-14.367l65.456-109.056l-15.568-31.344c-7.264-14.784-13.024-28.656-17.504-42.4l-10.992-33.664L79.518 548.46c-7.392-1.68-12.736-4.432-15.52-6.4v-59.504a.3.3 0 0 0 .145.032c1.072 0 6.336-3.745 10.72-4.544l120.72-26.737l11.087-35.28c4.512-14.368 10.672-29.344 18.816-45.775l15.568-31.36l-64.767-107.92c-4.016-6.432-5.872-12.16-6.432-15.52l42.08-42.065c4.08 1.312 8.672 2.96 10.88 4.48l107.312 68.4l32.88-17.344c16.88-8.895 34.336-16.239 51.904-21.823l34.016-10.832L478.11 79.501c1.697-7.391 4.416-12.735 6.4-15.52H544c-.433.657 3.68 6.24 4.527 10.865l26.88 121.408l34.848 11.264c16.336 5.28 32.752 12.16 48.72 20.448l32.752 17.008l103.152-65.712c4.32-2.945 8.944-4.576 13.088-4.576l42 40.816c-.56 3.328-2.32 8.816-5.808 14.416l-63.344 105.488l16.16 31.616c8.72 17.056 15.376 33.056 20.32 48.928l11.056 35.344L946.64 477.55c7.153 1.328 12.721 5.456 13.905 7.696zM512.43 319.674c-106.272 0-192.736 86.288-192.736 192.32c0 106.016 86.464 192.304 192.736 192.304s192.736-86.288 192.736-192.304c0-106.032-86.464-192.32-192.736-192.32m-.432 320.32c-70.576 0-128-57.424-128-128c0-70.592 57.424-128 128-128c70.592 0 128 57.408 128 128c0 70.576-57.424 128-128 128"/></svg></div><div style="font-size:1.3em">Quản lý</div></div>'
var icon_add_online_plugin = '<div class="settings-folder" style="padding:0!important"><div style="width:1.8em;height:1.3em;padding-right:.5em"><svg viewBox="0 0 32 32" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 32 32"><path d="m17 14.5 4.2-4.5L4.9 1.2c-.1-.1-.3-.1-.6-.2L17 14.5zM23 21l5.9-3.2c.7-.4 1.1-1 1.1-1.8s-.4-1.5-1.1-1.8L23 11l-4.7 5 4.7 5zM2.4 1.9c-.3.3-.4.7-.4 1.1v26c0 .4.1.8.4 1.2L15.6 16 2.4 1.9zM17 17.5 4.3 31c.2 0 .4-.1.6-.2L21.2 22 17 17.5z" fill="currentColor" fill="#currentColor" class="fill-000000"></path></svg></div><div style="font-size:1.3em">Trực tuyến</div></div>'
var icon_add_torrent_plugin = '<div class="settings-folder" style="padding:0!important"><div style="width:1.8em;height:1.3em;padding-right:.5em"><svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24"><path fill="currentColor" d="M13.684 23.94a12.01 12.01 0 0 0 9.599-7.79c-.118.044-.26.096-.432.147c-2 .59-3.404-.466-3.687-.649c-.283-.18-.587-.48-.643-.464c-.183 1.132-1.218 2.706-3.58 3.42c-1.295.391-2.687.4-3.681-.157l.328.822c.13.328.351.866.488 1.192c0 0 .858 2.044 1.608 3.48M2.723 7.153l3.54-.66c.323-.059.68.124.794.407l2.432 6.07c.332.633.399.773.615 1.043c0 0 1.68 2.398 4.24 1.812c1.726-.394 2.532-1.69 2.587-2.612c.057-.296-.032-.669-.185-1.016L13.832 5.61c-.117-.266.022-.527.306-.581l2.953-.55a.69.69 0 0 1 .706.376l3.227 6.91c.13.276.394.712.588.966c0 0 .671.964 1.747.78c.266 0 .569-.143.569-.143q.071-.645.072-1.31c0-6.627-5.373-12-12.002-12C5.372.06 0 5.433 0 12.06c0 5.319 3.46 9.827 8.252 11.402a25 25 0 0 1-.919-2.121L2.298 7.808c-.111-.297.083-.59.425-.654"/></svg></div><div style="font-size:1.3em">Torrent</div></div>'
var icon_add_tv_plugin = '<div class="settings-folder" style="padding:0!important"><div style="width:1.8em;height:1.3em;padding-right:.5em"><svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24"><g fill="none"><path stroke="currentColor" stroke-width="1.5" d="M22 16c0 2.828 0 4.243-.879 5.121C20.243 22 18.828 22 16 22H8c-2.828 0-4.243 0-5.121-.879C2 20.243 2 18.828 2 16v-4c0-2.828 0-4.243.879-5.121C3.757 6 5.172 6 8 6h8c2.828 0 4.243 0 5.121.879C22 7.757 22 9.172 22 12z"/><path stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="m9 2l3 3.5L15 2m1 4v16"/><path fill="currentColor" d="M20 16a1 1 0 1 0-2 0a1 1 0 0 0 2 0m0-4a1 1 0 1 0-2 0a1 1 0 0 0 2 0"/></g></svg></div><div style="font-size:1.3em">TV</div></div>'
var icon_add_music_plugin = '<div class="settings-folder" style="padding:0!important"><div style="width:1.8em;height:1.3em;padding-right:.5em"><svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2.25a.75.75 0 0 0-.75.75v11.26a4.25 4.25 0 1 0 1.486 2.888A1 1 0 0 0 12.75 17V7.75H18a2.75 2.75 0 1 0 0-5.5z"/></svg></div><div style="font-size:1.3em">Âm nhạc</div></div>'
var icon_add_radio_plugin = '<div class="settings-folder" style="padding:0!important"><div style="width:1.8em;height:1.3em;padding-right:.5em"><svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 26 26"><path fill="currentColor" d="M23.5.063c-.794 0-1.438.643-1.438 1.437L4.657 6.313c-.2-.076-.43-.125-.656-.125A1.81 1.81 0 0 0 2.187 8v.125C.933 8.484 0 9.63 0 11v11c0 1.656 1.344 3 3 3h20c1.656 0 3-1.344 3-3V11c0-1.656-1.344-3-3-3H5.812c0-.277-.076-.546-.187-.781l16.656-5c.25.428.688.719 1.219.719a1.437 1.437 0 1 0 0-2.876zm-6 10.75a5.696 5.696 0 0 1 5.688 5.687a5.696 5.696 0 0 1-5.688 5.688a5.697 5.697 0 0 1-5.688-5.688a5.697 5.697 0 0 1 5.688-5.688zm-13 .093c.877 0 1.594.717 1.594 1.594s-.717 1.594-1.594 1.594A1.597 1.597 0 0 1 2.906 12.5c0-.877.716-1.594 1.594-1.594m13 1.281c-.937 0-1.793.306-2.5.813h5a4.26 4.26 0 0 0-2.5-.813M14 14a4.3 4.3 0 0 0-.531 1h8.062A4.4 4.4 0 0 0 21 14zm-9.5 1.906c.877 0 1.594.717 1.594 1.594s-.717 1.594-1.594 1.594A1.597 1.597 0 0 1 2.906 17.5c0-.877.716-1.594 1.594-1.594m8.75.094c-.02.166-.063.328-.063.5s.043.334.063.5h8.5c.02-.166.063-.328.063-.5s-.044-.334-.063-.5zm.219 2q.202.538.531 1h7q.33-.462.531-1H13.47zM15 20a4.27 4.27 0 0 0 2.5.813c.938 0 1.793-.306 2.5-.813z"/></svg></div><div style="font-size:1.3em">Radio</div></div>'
var icon_add_sisi_plugin = '<div class="settings-folder" style="padding:0!important"><div style="width:1.8em;height:1.3em;padding-right:.5em"><svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><path fill="currentColor" d="M51.348 15.912c-3.332-3.347-7.33-4.796-11.498-4.796c-.359 0-.721.016-1.08.038C37.734 6.492 36.295 2 36.295 2s-6.291 3.991-9.97 7.716c-4.255-3.327-9.149-6.391-9.149-6.391s-1.044 7.646-.678 13.247c-5.577-.361-13.188.692-13.188.692s3.051 4.912 6.368 9.185C5.97 30.146 2 36.47 2 36.47s4.646 1.497 9.382 2.538c-.159 4.421 1.261 8.681 4.776 12.213C23.599 58.692 36.494 62 46.373 62c5.729-.001 10.445-1.113 12.492-3.17c5.522-5.549 4.184-31.161-7.517-42.918m6.074 41.482c-1.236 1.242-4.789 2.57-11.049 2.571c-9.275 0-21.77-3.147-28.771-10.18c-8.058-8.096-3.363-20.183 4.41-27.987c5.389-5.413 12.057-8.646 17.838-8.646c3.9.001 7.283 1.411 10.055 4.198c4.908 4.93 8.424 13.172 9.643 22.61c1.147 8.891-.2 15.499-2.126 17.434"/><path fill="currentColor" d="M40.172 18.321c.578.403 1.215.606 1.771.607c.541 0 1.006-.19 1.271-.573c.545-.775.063-2.052-1.072-2.848c-.58-.405-1.215-.607-1.773-.607c-.539 0-1.006.19-1.273.572c-.543.776-.063 2.054 1.076 2.849m3.902 14.408a1.34 1.34 0 0 0-.891.31c-.715.621-.557 1.976.352 3.025c.604.695 1.389 1.081 2.057 1.08c.34.001.65-.099.891-.309c.717-.621.557-1.975-.352-3.024c-.604-.696-1.387-1.081-2.057-1.082m-8.781-8.797a1.3 1.3 0 0 0-.865.294c-.727.609-.592 1.968.303 3.031c.602.715 1.391 1.114 2.064 1.115c.33 0 .629-.097.867-.295c.727-.61.59-1.966-.303-3.033c-.601-.714-1.392-1.113-2.066-1.112m17.111 2.537c-.518-.945-1.369-1.53-2.111-1.53a1.26 1.26 0 0 0-.604.148c-.832.456-.967 1.813-.301 3.032c.52.945 1.367 1.529 2.111 1.529c.213 0 .418-.047.604-.148c.833-.455.967-1.812.301-3.031m2.551 11.924q-.153 0-.303.039c-.918.24-1.379 1.521-1.027 2.866c.313 1.198 1.162 2.037 1.994 2.038q.153 0 .303-.038c.918-.239 1.379-1.523 1.027-2.868c-.312-1.196-1.164-2.037-1.994-2.037M53.76 51.021c-.354.001-.674.105-.918.327c-.703.636-.518 1.987.414 3.019c.607.671 1.381 1.038 2.041 1.039c.354-.001.676-.106.922-.329c.701-.636.516-1.987-.418-3.017c-.606-.669-1.379-1.039-2.041-1.039m-20.837-.979c-.569-.384-1.189-.573-1.736-.572c-.559 0-1.041.198-1.309.598c-.527.788-.02 2.054 1.135 2.825c.57.383 1.191.573 1.736.573c.561 0 1.042-.2 1.309-.6c.528-.786.02-2.053-1.135-2.824m-11.758-3.359c-.569-.382-1.189-.571-1.735-.571c-.561 0-1.042.199-1.309.597c-.527.787-.02 2.055 1.134 2.825c.57.382 1.191.574 1.738.573c.559 0 1.041-.199 1.307-.6c.526-.786.02-2.052-1.135-2.824m21.382 7.939a3.4 3.4 0 0 0-1.275-.259c-.797-.001-1.463.326-1.701.91c-.354.877.404 2.013 1.691 2.531c.434.175.871.258 1.275.257c.797 0 1.465-.324 1.699-.908c.356-.878-.4-2.012-1.689-2.531m2.617-9.926c-.543-.323-1.119-.481-1.633-.481c-.617-.001-1.143.229-1.406.672c-.486.814.09 2.053 1.283 2.763c.543.322 1.119.48 1.635.48c.615 0 1.141-.229 1.404-.672c.485-.816-.09-2.054-1.283-2.762m-10.596-6.943c-.602-.5-1.295-.758-1.895-.757c-.465-.001-.873.155-1.138.474c-.604.729-.229 2.042.839 2.928c.603.498 1.297.758 1.897.758c.465 0 .871-.156 1.137-.475c.604-.73.231-2.043-.84-2.928m-10.701-14.53c-.385.001-.73.119-.982.368c-.676.665-.434 2.008.539 2.997c.611.618 1.364.953 2.009.954c.384-.001.729-.119.981-.368c.676-.666.435-2.008-.539-2.996c-.612-.621-1.364-.954-2.008-.955m-1.055 11.751c-.598-.473-1.275-.716-1.863-.715c-.484 0-.909.163-1.175.5c-.589.741-.184 2.046.904 2.906c.598.474 1.276.715 1.864.715c.484 0 .908-.161 1.174-.499c.587-.742.184-2.045-.904-2.907"/></svg></div><div style="font-size:1.3em">18+</div></div>'
var ads = '<div style="padding: 0.3em 0.3em; padding-top: 0;"><div style="background: #3e3e3e; padding: 0.5em; border-radius: 1em;"><div style="line-height: 1.2;"><span style="color: #ffffff"><div style="text-align: center;">Tham gia nhóm của chúng tôi<br> PLUGIN KHÔNG KIỂM DUYỆT</br><span style="color: #f3d900">@lampa_plugins_uncensored</span></span></div></div></div></div>'	
var nthChildIndex = null; // Khai báo biến để lưu chỉ số nth-child

/* Các hàm được gọi thường xuyên */
	Lampa.Storage.set('needReboot', false);
	Lampa.Storage.set('needRebootSettingExit', false);

/* Yêu cầu tải lại trong cửa sổ modal */
function showReload(reloadText){
  if (document.querySelector('.modal') == null) {
   Lampa.Modal.open({
      title: '',
      align: 'center',
      zIndex: 300,
      html: $('<div class="about">' + reloadText + '</div>'),
      buttons: [{
        name: 'Không',
        onSelect: function onSelect() {
         //Lampa.Modal.close();
          $('.modal').remove();
	  Lampa.Controller.toggle('content')
        }
      }, {
        name: 'Có',
        onSelect: function onSelect() {
          window.location.reload();
        }
      }]
   });
  }
}

/* Hàm hiệu ứng cài đặt plugin */	
function showLoadingBar() {
  // Tạo phần tử cho thanh tải
  var loadingBar = document.createElement('div');
  loadingBar.className = 'loading-bar';
  loadingBar.style.position = 'fixed';
  loadingBar.style.top = '50%';
  loadingBar.style.left = '50%';
  loadingBar.style.transform = 'translate(-50%, -50%)'; // Căn giữa
  loadingBar.style.zIndex = '9999';
  loadingBar.style.display = 'none';
  loadingBar.style.width = '30em';
  loadingBar.style.height = '2.5em'; 
  loadingBar.style.backgroundColor = '#595959';
  loadingBar.style.borderRadius = '4em';

  // Tạo phần tử cho chỉ báo tải
  var loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'loading-indicator';
  loadingIndicator.style.position = 'absolute';
  loadingIndicator.style.left = '0';
  loadingIndicator.style.top = '0';
  loadingIndicator.style.bottom = '0';
  loadingIndicator.style.width = '0';
  loadingIndicator.style.backgroundColor = '#64e364';
  loadingIndicator.style.borderRadius = '4em';

  // Tạo phần tử hiển thị phần trăm tải
  var loadingPercentage = document.createElement('div');
  loadingPercentage.className = 'loading-percentage';
  loadingPercentage.style.position = 'absolute';
  loadingPercentage.style.top = '50%';
  loadingPercentage.style.left = '50%';
  loadingPercentage.style.transform = 'translate(-50%, -50%)';
  loadingPercentage.style.color = '#fff';
  loadingPercentage.style.fontWeight = 'bold';
  loadingPercentage.style.fontSize = '1.7em';

  // Thêm các phần tử vào trang
  loadingBar.appendChild(loadingIndicator);
  loadingBar.appendChild(loadingPercentage);
  document.body.appendChild(loadingBar);

  // Hiển thị thanh tải
  loadingBar.style.display = 'block';

  // Hoạt ảnh sử dụng setTimeout
  var startTime = Date.now();
  var duration = 1000; // 1 giây
  var interval = setInterval(function() {
  var elapsed = Date.now() - startTime;
  var progress = Math.min((elapsed / duration) * 100, 100);

    loadingIndicator.style.width = progress + '%';
    loadingPercentage.textContent = Math.round(progress) + '%';

    if (elapsed >= duration) {
      clearInterval(interval);
      setTimeout(function() {
        loadingBar.style.display = 'none';
        loadingBar.parentNode.removeChild(loadingBar);
      }, 250);
    }
  }, 16);
}

/* Hàm hiệu ứng xóa plugin */	
function showDeletedBar() {
  // Tạo phần tử cho thanh tải
  var loadingBar = document.createElement('div');
  loadingBar.className = 'loading-bar';
  loadingBar.style.position = 'fixed';
  loadingBar.style.top = '50%';
  loadingBar.style.left = '50%';
  loadingBar.style.transform = 'translate(-50%, -50%)'; // Căn giữa
  loadingBar.style.zIndex = '9999';
  loadingBar.style.display = 'none';
  loadingBar.style.width = '30em';
  loadingBar.style.height = '2.5em';
  loadingBar.style.backgroundColor = '#595959';
  loadingBar.style.borderRadius = '4em';

  // Tạo phần tử cho chỉ báo tải
  var loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'loading-indicator';
  loadingIndicator.style.position = 'absolute';
  loadingIndicator.style.left = '0';
  loadingIndicator.style.top = '0';
  loadingIndicator.style.bottom = '0';
  loadingIndicator.style.width = '0';
  loadingIndicator.style.backgroundColor = '#ff2121';
  loadingIndicator.style.borderRadius = '4em';

  // Tạo phần tử hiển thị phần trăm tải
  var loadingPercentage = document.createElement('div');
  loadingPercentage.className = 'loading-percentage';
  loadingPercentage.style.position = 'absolute';
  loadingPercentage.style.top = '50%';
  loadingPercentage.style.left = '50%';
  loadingPercentage.style.transform = 'translate(-50%, -50%)';
  loadingPercentage.style.color = '#fff';
  loadingPercentage.style.fontWeight = 'bold';
  loadingPercentage.style.fontSize = '1.7em';

  // Thêm các phần tử vào trang
  loadingBar.appendChild(loadingIndicator);
  loadingBar.appendChild(loadingPercentage);
  document.body.appendChild(loadingBar);

  // Hiển thị thanh tải
  loadingBar.style.display = 'block';

  // Hoạt ảnh sử dụng setTimeout
  var startTime = Date.now();
  var duration = 1000; // 1 giây
  var interval = setInterval(function() {
  var elapsed = Date.now() - startTime;
  var progress = 100 - Math.min((elapsed / duration) * 100, 100);

    loadingIndicator.style.width = progress + '%';
    loadingPercentage.textContent = Math.round(progress) + '%';

    if (elapsed >= duration) {
      clearInterval(interval);
      setTimeout(function() {
        loadingBar.style.display = 'none';
        loadingBar.parentNode.removeChild(loadingBar);
      }, 250);
    }
  }, 16);
}

/* Theo dõi cài đặt */
function settingsWatch() {
	/* kiểm tra cờ tải lại và chờ thoát khỏi cài đặt */
	if (Lampa.Storage.get('needRebootSettingExit')) {
  		var intervalSettings = setInterval(function() {
  			var elementSettings = $('#app > div.settings > div.settings__content.layer--height > div.settings__body > div');
  			if (!elementSettings.length > 0){
    				clearInterval(intervalSettings);
				showReload('Để xóa plugin hoàn toàn, vui lòng tải lại ứng dụng!');
  			}
		}, 1000)
	}
}

function itemON(sourceURL, sourceName, sourceAuthor, itemName) {
if ($('DIV[data-name="' + itemName + '"]').find('.settings-param__status').hasClass('active')) {
  Lampa.Noty.show("Plugin đã được cài đặt!");
} else if ($('DIV[data-name="' + itemName + '"]').find('.settings-param__status').css('background-color') === 'rgb(255, 165, 0)') {
  Lampa.Noty.show("Plugin đã được cài đặt, nhưng đã tắt trong phần mở rộng!");
} else {	
	// Nếu không yêu cầu tải lại - kiểm soát sau khi xóa plugin
   if (!Lampa.Storage.get('needReboot')) {
	// Lấy danh sách plugin
		var pluginsArray = Lampa.Storage.get('plugins');
	// Thêm phần tử mới vào danh sách
		pluginsArray.push({
			"author": sourceAuthor,
			"url": sourceURL,
			"name": sourceName,
			"status": 1
		});
	// Áp dụng danh sách đã sửa vào Lampa
		Lampa.Storage.set('plugins', pluginsArray);
	// Chèn script để hoạt động ngay lập tức
		var script = document.createElement ('script');
		script.src = sourceURL;
		document.getElementsByTagName ('head')[0].appendChild (script);
	        showLoadingBar();
	          setTimeout(function() {
			Lampa.Settings.update();
			Lampa.Noty.show("Plugin " + sourceName + " đã được cài đặt thành công")
		  }, 1500);
	          setTimeout(function() {
                    if (nthChildIndex) {
                        var F = document.querySelector("#app > div.settings.animate > div.settings__content.layer--height > div.settings__body > div > div > div > div > div:nth-child(" + nthChildIndex + ")")
                        Lampa.Controller.focus(F);
                        Lampa.Controller.toggle('settings_component');
                    } else {
                        console.error("Lỗi: Không tìm thấy phần tử với chỉ số nth-child " + nthChildIndex + ".");
                    }
                  }, 2000);
   }
}
}	
function hideInstall() {
	$("#hideInstall").remove();
	$('body').append('<div id="hideInstall"><style>div.settings-param__value{opacity: 0%!important;display: none;}</style><div>')
}

function deletePlugin(pluginToRemoveUrl) {
	var plugins = Lampa.Storage.get('plugins');
	var updatedPlugins = plugins.filter(function(obj) {return obj.url !== pluginToRemoveUrl});
	Lampa.Storage.set('plugins', updatedPlugins);
	setTimeout(function() {
	  Lampa.Settings.update();
	  Lampa.Noty.show("Plugin đã được gỡ bỏ thành công");
	}, 1500);
	setTimeout(function() {
                    if (nthChildIndex) {
                        var F = document.querySelector("#app > div.settings.animate > div.settings__content.layer--height > div.settings__body > div > div > div > div > div:nth-child(" + nthChildIndex + ")")
                        Lampa.Controller.focus(F);
                        Lampa.Controller.toggle('settings_component');
                    } else {
                        console.error("Lỗi: Không tìm thấy phần tử với chỉ số nth-child " + nthChildIndex + ".");
                    }
         }, 2000);
	Lampa.Storage.set('needRebootSettingExit', true);
	   settingsWatch();
	   showDeletedBar();
};

function checkPlugin(pluginToCheck) {
	var plugins = Lampa.Storage.get('plugins');
	var checkResult = plugins.filter(function(obj) {return obj.url == pluginToCheck});
	console.log('search', 'checkResult: ' + JSON.stringify(checkResult));
	console.log('search', 'pluginToCheck: ' + pluginToCheck);
	if (JSON.stringify(checkResult) !== '[]') {return true} else {return false}
};

// Hàm lấy chỉ số của tham số
function focus_back(event) {
    var targetElement = event.target; // Lấy đối tượng sự kiện

    // Tìm phần tử cha
    var parentElement = targetElement.parentElement;

    // Lấy danh sách tất cả phần tử con
    var children = Array.from(parentElement.children);

    // Tìm chỉ số (bắt đầu từ 0) của phần tử hiện tại
    var index = children.indexOf(targetElement);

    // nth-child sử dụng chỉ số bắt đầu từ 1
    var nthChildIndex = index + 1;

    // Trả về chỉ số tìm được
    return nthChildIndex;
}

/* Component */
Lampa.SettingsApi.addComponent({
            component: 'add_plugin',
            name: 'Plugin',
            icon: icon_add_plugin
       });
/* Giao diện */
        Lampa.Settings.listener.follow('open', function (e) {
            if (e.name == 'main') {
                Lampa.SettingsApi.addComponent({
                    component: 'add_interface_plugin',
                    name: 'Giao diện'
				});
				setTimeout(function() {
					$('div[data-component="add_interface_plugin"]').remove();
					$('div[data-component="add_management_plugin"]').remove();
					$('div[data-component="add_online_plugin"]').remove();
					$('div[data-component="add_torrent_plugin"]').remove();
					$('div[data-component="add_tv_plugin"]').remove();
					$('div[data-component="add_music_plugin"]').remove();
					$('div[data-component="add_radio_plugin"]').remove();
					$('div[data-component="add_sisi_plugin"]').remove();
					$('div[data-component="pirate_store"]').remove();
				}, 0);
				$("#hideInstall").remove();
		                /* Di chuyển phần lên trên */
				        setTimeout(function() {
					  $('div[data-component=plugins]').before($('div[data-component=add_plugin]'))
					}, 30)
			}
		});

		Lampa.SettingsApi.addParam({
					component: 'add_plugin',
					param: {
						name: 'add_interface_plugin',
						type: 'static',
						default: true
                         },
					field: {
						name: icon_add_interface_plugin
                        },
					onRender: function(item) {
					item.on('hover:enter', function () {
						Lampa.Settings.create('add_interface_plugin');
						Lampa.Controller.enabled().controller.back = function(){
							Lampa.Settings.create('add_plugin');
						}
                            });
					}
		});

		Lampa.SettingsApi.addParam({
					component: 'add_interface_plugin',
					param: {
						name: 'TMDB',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
						name: 'TMDB Proxy',
						description: 'Proxy ảnh poster cho trang TMDB'
                            },
					onChange: function(value) {
						if (value == '1') {
							itemON('https://bylampa.github.io/tmdb-proxy.js', 'TMDB Proxy', '@lampa', 'TMDB', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/tmdb-proxy.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
					onRender: function (item) {
						$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('https://bylampa.github.io/tmdb-proxy.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="TMDB"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/tmdb-proxy.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="TMDB"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="TMDB"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="TMDB"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});
Lampa.SettingsApi.addParam({
			component: 'add_interface_plugin',
			param: {
				name: 'Tricks',
				type: 'select',
				values: {
					1:	'Cài đặt',
					2:	'Gỡ bỏ',
				},
				},
			field: {
				name: 'Tiện ích nhỏ',
				description: 'Plugin cho phép cài đặt các tính năng bổ sung tùy chọn (màn hình chờ, tùy chỉnh nút, kiểu trình phát, đồng hồ trong trình phát, v.v.)'
			},
			onChange: function(value) {
				if (value == '1') {
					itemON('https://andreyurl54.github.io/diesel5/tricks.js', 'Tiện ích nhỏ', '@AndreyURL54', 'Tricks', nthChildIndex);
				}
				if (value == '2') {
					var pluginToRemoveUrl = "https://andreyurl54.github.io/diesel5/tricks.js";
					deletePlugin(pluginToRemoveUrl, nthChildIndex);
				}	
			},
			onRender: function (item) {$('.settings-param__name', item).css('color','f3d900');  hideInstall()
				var myResult = checkPlugin('https://andreyurl54.github.io/diesel5/tricks.js');
                                              var pluginsArray = Lampa.Storage.get('plugins');
                                                  setTimeout(function() {
                                                     $('div[data-name="Tricks"]').append('<div class="settings-param__status one"></div>');
                                                     var pluginStatus = null;
                                                     for (var i = 0; i < pluginsArray.length; i++) {
                                                        if (pluginsArray[i].url === 'https://andreyurl54.github.io/diesel5/tricks.js') {
                                                           pluginStatus = pluginsArray[i].status;
                                                           break;
                                                        }
                                                     }
                                                     if (myResult && pluginStatus !== 0) {
                                                        $('div[data-name="Tricks"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                     } else if (pluginStatus === 0) {
                                                        $('div[data-name="Tricks"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                     } else {
                                                        $('div[data-name="Tricks"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                     }
                                                  }, 100);
				    item.on("hover:enter", function (event) {
                                                      nthChildIndex = focus_back(event);
				    });		   
			}
});

Lampa.SettingsApi.addParam({
			component: 'add_interface_plugin',
			param: {
				name: 'Rating',
				type: 'select',
				values: {
					1:	'Cài đặt',
					2:	'Gỡ bỏ',
				},
				},
			field: {
				name: 'Điểm Kinopoisk và IMDB',
				description: 'Hiển thị điểm Kinopoisk và IMDB trong thẻ phim. Chức năng tương tự một phần của MODSs, vì vậy không nên dùng chung'
			},
			onChange: function(value) {
				if (value == '1') {
					itemON('https://bylampa.github.io/rating.js', 'Điểm Kinopoisk và IMDB', '@t_anton', 'Rating', nthChildIndex);
				}
				if (value == '2') {
					var pluginToRemoveUrl = "https://bylampa.github.io/rating.js";
					deletePlugin(pluginToRemoveUrl, nthChildIndex);
				}
			},
			onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
				var myResult = checkPlugin('https://bylampa.github.io/rating.js');
                                              var pluginsArray = Lampa.Storage.get('plugins');
                                                  setTimeout(function() {
                                                     $('div[data-name="Rating"]').append('<div class="settings-param__status one"></div>');
                                                     var pluginStatus = null;
                                                     for (var i = 0; i < pluginsArray.length; i++) {
                                                        if (pluginsArray[i].url === 'https://bylampa.github.io/rating.js') {
                                                           pluginStatus = pluginsArray[i].status;
                                                           break;
                                                        }
                                                     }
                                                     if (myResult && pluginStatus !== 0) {
                                                        $('div[data-name="Rating"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                     } else if (pluginStatus === 0) {
                                                        $('div[data-name="Rating"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                     } else {
                                                        $('div[data-name="Rating"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                     }
                                                  }, 100);
				    item.on("hover:enter", function (event) {
                                                      nthChildIndex = focus_back(event);
				    });	      
			}
});
       Lampa.SettingsApi.addParam({
			component: 'add_interface_plugin',
			param: {
				name: 'Want',
				type: 'select',
				values: {
					1:	'Cài đặt',
					2:	'Gỡ bỏ',
				},
				},
			field: {
				name: 'Kiểu cũ cho các mục (Đánh dấu, Thích, Xem sau)',
				description: 'Plugin khôi phục kiểu hiển thị cũ cho các mục (Đánh dấu, Thích, Xem sau) trong menu chính'
			},
			onChange: function(value) {
				if (value == '1') {
					itemON('http://github.freebie.tom.ru/want.js', 'Kiểu cũ cho các mục (Đánh dấu, Thích, Xem sau)', '@VitalikPVA', 'Want', nthChildIndex);
				}
				if (value == '2') {
					var pluginToRemoveUrl = "http://github.freebie.tom.ru/want.js";
					deletePlugin(pluginToRemoveUrl, nthChildIndex);
				}
			},
			onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
				var myResult = checkPlugin('http://github.freebie.tom.ru/want.js');
                                              var pluginsArray = Lampa.Storage.get('plugins');
                                                  setTimeout(function() {
                                                     $('div[data-name="Want"]').append('<div class="settings-param__status one"></div>');
                                                     var pluginStatus = null;
                                                     for (var i = 0; i < pluginsArray.length; i++) {
                                                        if (pluginsArray[i].url === 'http://github.freebie.tom.ru/want.js') {
                                                           pluginStatus = pluginsArray[i].status;
                                                           break;
                                                        }
                                                     }
                                                     if (myResult && pluginStatus !== 0) {
                                                        $('div[data-name="Want"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                     } else if (pluginStatus === 0) {
                                                        $('div[data-name="Want"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                     } else {
                                                        $('div[data-name="Want"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                     }
                                                  }, 100);
				    item.on("hover:enter", function (event) {
                                                      nthChildIndex = focus_back(event);
				    });	   
			}
});
       Lampa.SettingsApi.addParam({
			component: 'add_interface_plugin',
			param: {
				name: 'Sub_reset',
				type: 'select',
				values: {
					1:	'Cài đặt',
					2:	'Gỡ bỏ',
				},
				},
			field: {
				name: 'Đặt lại cài đặt phụ đề',
				description: 'Plugin đặt lại cài đặt phụ đề về mặc định'
			},
			onChange: function(value) {
				if (value == '1') {
				       itemON('https://nb557.github.io/plugins/reset_subs.js', 'Đặt lại cài đặt phụ đề', '@t_anton', 'Sub_reset', nthChildIndex);
				}
				if (value == '2') {
					var pluginToRemoveUrl = "https://nb557.github.io/plugins/reset_subs.js";
					deletePlugin(pluginToRemoveUrl, nthChildIndex);
				}
			},
			onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
				var myResult = checkPlugin('https://nb557.github.io/plugins/reset_subs.js');
                                              var pluginsArray = Lampa.Storage.get('plugins');
                                                  setTimeout(function() {
                                                     $('div[data-name="Sub_reset"]').append('<div class="settings-param__status one"></div>');
                                                     var pluginStatus = null;
                                                     for (var i = 0; i < pluginsArray.length; i++) {
                                                        if (pluginsArray[i].url === 'https://nb557.github.io/plugins/reset_subs.js') {
                                                           pluginStatus = pluginsArray[i].status;
                                                           break;
                                                        }
                                                     }
                                                     if (myResult && pluginStatus !== 0) {
                                                        $('div[data-name="Sub_reset"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                     } else if (pluginStatus === 0) {
                                                        $('div[data-name="Sub_reset"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                     } else {
                                                        $('div[data-name="Sub_reset"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                     }
                                                  }, 100);
				    item.on("hover:enter", function (event) {
                                                      nthChildIndex = focus_back(event);
				    });
			}
});
        Lampa.SettingsApi.addParam({
			component: 'add_interface_plugin',
			param: {
				name: 'Mult',
				type: 'select',
				values: {
					1:	'Cài đặt',
					2:	'Gỡ bỏ',
				},
				},
			field: {
				name: 'Phim hoạt hình',
				description: 'Plugin thay thế mục Anime thành Phim hoạt hình'
			},
			onChange: function(value) {
				if (value == '1') {
				       itemON('http://193.233.134.21/plugins/mult.js', 'Phim hoạt hình', '@AndreyURL54', 'Mult', nthChildIndex);
				}
				if (value == '2') {
					var pluginToRemoveUrl = "http://193.233.134.21/plugins/mult.js";
					deletePlugin(pluginToRemoveUrl, nthChildIndex);
				}
			},
	                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
				var myResult = checkPlugin('http://193.233.134.21/plugins/mult.js');
                                              var pluginsArray = Lampa.Storage.get('plugins');
                                                  setTimeout(function() {
                                                     $('div[data-name="Mult"]').append('<div class="settings-param__status one"></div>');
                                                     var pluginStatus = null;
                                                     for (var i = 0; i < pluginsArray.length; i++) {
                                                        if (pluginsArray[i].url === 'http://193.233.134.21/plugins/mult.js') {
                                                           pluginStatus = pluginsArray[i].status;
                                                           break;
                                                        }
                                                     }
                                                     if (myResult && pluginStatus !== 0) {
                                                        $('div[data-name="Mult"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                     } else if (pluginStatus === 0) {
                                                        $('div[data-name="Mult"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                     } else {
                                                        $('div[data-name="Mult"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                     }
                                                  }, 100);
				    item.on("hover:enter", function (event) {
                                                      nthChildIndex = focus_back(event);
				    });
			}
});
       Lampa.SettingsApi.addParam({
			component: 'add_interface_plugin',
			param: {
				name: 'Collections',
				type: 'select',
				values: {
					1:	'Cài đặt',
					2:	'Gỡ bỏ',
				},
				},
			field: {
				name: 'Bộ sưu tập',
				description: 'Khám phá các bộ sưu tập phim và series hấp dẫn trong menu chính của ứng dụng. Từ phim mới đến kinh điển, mỗi bộ sưu tập là một hành trình thú vị vào thế giới điện ảnh'
			},
			onChange: function(value) {
				if (value == '1') {
				       itemON('https://cub.red/plugin/collections', 'Bộ sưu tập', '@lampa', 'Collections', nthChildIndex);
				}
				if (value == '2') {
					var pluginToRemoveUrl = "https://cub.red/plugin/collections";
					deletePlugin(pluginToRemoveUrl, nthChildIndex);
				}
			},
	                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
				var myResult = checkPlugin('https://cub.red/plugin/collections');
                                              var pluginsArray = Lampa.Storage.get('plugins');
                                                  setTimeout(function() {
                                                     $('div[data-name="Collections"]').append('<div class="settings-param__status one"></div>');
                                                     var pluginStatus = null;
                                                     for (var i = 0; i < pluginsArray.length; i++) {
                                                        if (pluginsArray[i].url === 'https://cub.red/plugin/collections') {
                                                           pluginStatus = pluginsArray[i].status;
                                                           break;
                                                        }
                                                     }
                                                     if (myResult && pluginStatus !== 0) {
                                                        $('div[data-name="Collections"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                     } else if (pluginStatus === 0) {
                                                        $('div[data-name="Collections"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                     } else {
                                                        $('div[data-name="Collections"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                     }
                                                  }, 100);
				    item.on("hover:enter", function (event) {
                                                      nthChildIndex = focus_back(event);
				    });
			}
});
       Lampa.SettingsApi.addParam({
			component: 'add_interface_plugin',
			param: {
				name: 'Weather',
				type: 'select',
				values: {
					1:	'Cài đặt',
					2:	'Gỡ bỏ',
				},
				},
			field: {
				name: 'Thời tiết',
				description: 'Plugin sẽ luân phiên hiển thị thời gian và thời tiết'
			},
			onChange: function(value) {
				if (value == '1') {
				       itemON('https://bylampa.github.io/weather.js', 'Thời tiết', '@scabrum', 'Weather', nthChildIndex);
				}
				if (value == '2') {
					var pluginToRemoveUrl = "https://bylampa.github.io/weather.js";
					deletePlugin(pluginToRemoveUrl, nthChildIndex);
				}
			},
	                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
				var myResult = checkPlugin('https://bylampa.github.io/weather.js');
                                              var pluginsArray = Lampa.Storage.get('plugins');
                                                  setTimeout(function() {
                                                     $('div[data-name="Weather"]').append('<div class="settings-param__status one"></div>');
                                                     var pluginStatus = null;
                                                     for (var i = 0; i < pluginsArray.length; i++) {
                                                        if (pluginsArray[i].url === 'https://bylampa.github.io/weather.js') {
                                                           pluginStatus = pluginsArray[i].status;
                                                           break;
                                                        }
                                                     }
                                                     if (myResult && pluginStatus !== 0) {
                                                        $('div[data-name="Weather"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                     } else if (pluginStatus === 0) {
                                                        $('div[data-name="Weather"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                     } else {
                                                        $('div[data-name="Weather"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                     }
                                                  }, 100);
				    item.on("hover:enter", function (event) {
                                                      nthChildIndex = focus_back(event);
				    });
			}
});
       Lampa.SettingsApi.addParam({
			component: 'add_interface_plugin',
			param: {
				name: 'Cub_off',
				type: 'select',
				values: {
					1:	'Cài đặt',
					2:	'Gỡ bỏ',
				},
				},
			field: {
				name: 'Tắt Cub',
				description: 'Plugin loại bỏ các phần tử đề xuất đăng ký Cub Premium'
			},
			onChange: function(value) {
				if (value == '1') {
				       itemON('https://bylampa.github.io/cub_off.js', 'Tắt Cub', '@scabrum', 'Cub_off', nthChildIndex);
				}
				if (value == '2') {
					var pluginToRemoveUrl = "https://bylampa.github.io/cub_off.js";
					deletePlugin(pluginToRemoveUrl, nthChildIndex);
				}
			},
	                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
				var myResult = checkPlugin('https://bylampa.github.io/cub_off.js');
                                              var pluginsArray = Lampa.Storage.get('plugins');
                                                  setTimeout(function() {
                                                     $('div[data-name="Cub_off"]').append('<div class="settings-param__status one"></div>');
                                                     var pluginStatus = null;
                                                     for (var i = 0; i < pluginsArray.length; i++) {
                                                        if (pluginsArray[i].url === 'https://bylampa.github.io/cub_off.js') {
                                                           pluginStatus = pluginsArray[i].status;
                                                           break;
                                                        }
                                                     }
                                                     if (myResult && pluginStatus !== 0) {
                                                        $('div[data-name="Cub_off"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                     } else if (pluginStatus === 0) {
                                                        $('div[data-name="Cub_off"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                     } else {
                                                        $('div[data-name="Cub_off"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                     }
                                                  }, 100);
				    item.on("hover:enter", function (event) {
                                                      nthChildIndex = focus_back(event);
				    });
			}
});
       Lampa.SettingsApi.addParam({
			component: 'add_interface_plugin',
			param: {
				name: 'Style_interface_fix',
				type: 'select',
				values: {
					1:	'Cài đặt',
					2:	'Gỡ bỏ',
				},
				},
			field: {
				name: 'Giao diện phong cách',
				description: 'Giao diện phong cách mới cho danh mục TMDB và CUB. Phù hợp với những ai thích giao diện của Kinopoisk hoặc Netflix'
			},
			onChange: function(value) {
				if (value == '1') {
				       itemON('https://bylampa.github.io/interface.js', 'Giao diện phong cách', '@lampa', 'Style_interface_fix', nthChildIndex);
				}
				if (value == '2') {
					var pluginToRemoveUrl = "https://bylampa.github.io/interface.js";
					deletePlugin(pluginToRemoveUrl, nthChildIndex);
				}
			},
	                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
				var myResult = checkPlugin('https://bylampa.github.io/interface.js');
                                              var pluginsArray = Lampa.Storage.get('plugins');
                                                  setTimeout(function() {
                                                     $('div[data-name="Style_interface_fix"]').append('<div class="settings-param__status one"></div>');
                                                     var pluginStatus = null;
                                                     for (var i = 0; i < pluginsArray.length; i++) {
                                                        if (pluginsArray[i].url === 'https://bylampa.github.io/interface.js') {
                                                           pluginStatus = pluginsArray[i].status;
                                                           break;
                                                        }
                                                     }
                                                     if (myResult && pluginStatus !== 0) {
                                                        $('div[data-name="Style_interface_fix"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                     } else if (pluginStatus === 0) {
                                                        $('div[data-name="Style_interface_fix"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                     } else {
                                                        $('div[data-name="Style_interface_fix"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                     }
                                                  }, 100);
				    item.on("hover:enter", function (event) {
                                                      nthChildIndex = focus_back(event);
				    });
			}
});
       Lampa.SettingsApi.addParam({
			component: 'add_interface_plugin',
			param: {
				name: 'New_cat',
				type: 'select',
				values: {
					1:	'Cài đặt',
					2:	'Gỡ bỏ',
				},
				},
			field: {
				name: 'Danh mục bổ sung',
				description: 'Plugin cho phép thêm các danh mục vào menu chính (Phim tài liệu, Hòa nhạc và Phim hoạt hình)'
			},
			onChange: function(value) {
				if (value == '1') {
				       itemON('https://lampame.github.io/main/nc/nc.js', 'Danh mục bổ sung', '@GwynnBleiidd', 'New_cat', nthChildIndex);
				}
				if (value == '2') {
					var pluginToRemoveUrl = "https://lampame.github.io/main/nc/nc.js";
					deletePlugin(pluginToRemoveUrl, nthChildIndex);
				}
			},
	                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
				var myResult = checkPlugin('https://lampame.github.io/main/nc/nc.js');
                                              var pluginsArray = Lampa.Storage.get('plugins');
                                                  setTimeout(function() {
                                                     $('div[data-name="New_cat"]').append('<div class="settings-param__status one"></div>');
                                                     var pluginStatus = null;
                                                     for (var i = 0; i < pluginsArray.length; i++) {
                                                        if (pluginsArray[i].url === 'https://lampame.github.io/main/nc/nc.js') {
                                                           pluginStatus = pluginsArray[i].status;
                                                           break;
                                                        }
                                                     }
                                                     if (myResult && pluginStatus !== 0) {
                                                        $('div[data-name="New_cat"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                     } else if (pluginStatus === 0) {
                                                        $('div[data-name="New_cat"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                     } else {
                                                        $('div[data-name="New_cat"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                     }
                                                  }, 100);
				    item.on("hover:enter", function (event) {
                                                      nthChildIndex = focus_back(event);
				    });
			}
});
       Lampa.SettingsApi.addParam({
			component: 'add_interface_plugin',
			param: {
				name: 'New_source',
				type: 'select',
				values: {
					1:	'Cài đặt',
					2:	'Gỡ bỏ',
				},
				},
			field: {
				name: 'Nguồn bổ sung',
				description: 'Plugin thêm các nguồn bổ sung để lấy thông tin phim'
			},
			onChange: function(value) {
				if (value == '1') {
				       itemON('https://bylampa.github.io/source.js', 'Nguồn bổ sung', '@scabrum', 'New_source', nthChildIndex);
				}
				if (value == '2') {
					var pluginToRemoveUrl = "https://bylampa.github.io/source.js";
					deletePlugin(pluginToRemoveUrl, nthChildIndex);
				}
			},
	                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
				var myResult = checkPlugin('https://bylampa.github.io/source.js');
                                              var pluginsArray = Lampa.Storage.get('plugins');
                                                  setTimeout(function() {
                                                     $('div[data-name="New_source"]').append('<div class="settings-param__status one"></div>');
                                                     var pluginStatus = null;
                                                     for (var i = 0; i < pluginsArray.length; i++) {
                                                        if (pluginsArray[i].url === 'https://bylampa.github.io/source.js') {
                                                           pluginStatus = pluginsArray[i].status;
                                                           break;
                                                        }
                                                     }
                                                     if (myResult && pluginStatus !== 0) {
                                                        $('div[data-name="New_source"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                     } else if (pluginStatus === 0) {
                                                        $('div[data-name="New_source"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                     } else {
                                                        $('div[data-name="New_source"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                     }
                                                  }, 100);
				    item.on("hover:enter", function (event) {
                                                      nthChildIndex = focus_back(event);
				    });
			}
});

      Lampa.SettingsApi.addParam({
			component: 'add_interface_plugin',
			param: {
				name: 'kp_source',
				type: 'select',
				values: {
					1:	'Cài đặt',
					2:	'Gỡ bỏ',
				},
				},
			field: {
				name: 'Nguồn KP',
				description: 'Plugin thêm nguồn KP'
			},
			onChange: function(value) {
				if (value == '1') {
				       itemON('https://bylampa.github.io/kp_source.js', 'Nguồn KP', '@bylampa', 'kp_source', nthChildIndex);
				}
				if (value == '2') {
					var pluginToRemoveUrl = "https://bylampa.github.io/kp_source.js";
					deletePlugin(pluginToRemoveUrl, nthChildIndex);
				}
			},
	                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
				var myResult = checkPlugin('https://bylampa.github.io/kp_source.js');
                                              var pluginsArray = Lampa.Storage.get('plugins');
                                                  setTimeout(function() {
                                                     $('div[data-name="kp_source"]').append('<div class="settings-param__status one"></div>');
                                                     var pluginStatus = null;
                                                     for (var i = 0; i < pluginsArray.length; i++) {
                                                        if (pluginsArray[i].url === 'https://bylampa.github.io/kp_source.js') {
                                                           pluginStatus = pluginsArray[i].status;
                                                           break;
                                                        }
                                                     }
                                                     if (myResult && pluginStatus !== 0) {
                                                        $('div[data-name="kp_source"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                     } else if (pluginStatus === 0) {
                                                        $('div[data-name="kp_source"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                     } else {
                                                        $('div[data-name="kp_source"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                     }
                                                  }, 100);
				    item.on("hover:enter", function (event) {
                                                      nthChildIndex = focus_back(event);
				    });
			}
});

   Lampa.SettingsApi.addParam({
       		component: 'add_interface_plugin',
			param: {
				name: 'Start',
				type: 'select',
				values: {
					1:	'Cài đặt',
					2:	'Gỡ bỏ',
				},
				},
			field: {
				name: 'Start',
				description: 'Plugin cho phép truy cập các thẻ phim bị chặn'
			},
			onChange: function(value) {
				if (value == '1') {
				       itemON('https://bylampa.github.io/start.js', 'Start', '@scabrum', 'Start', nthChildIndex);
				}
				if (value == '2') {
					var pluginToRemoveUrl = "https://bylampa.github.io/start.js";
					deletePlugin(pluginToRemoveUrl, nthChildIndex);
				}
			},
	                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
				var myResult = checkPlugin('https://bylampa.github.io/start.js');
                                              var pluginsArray = Lampa.Storage.get('plugins');
                                                  setTimeout(function() {
                                                     $('div[data-name="Start"]').append('<div class="settings-param__status one"></div>');
                                                     var pluginStatus = null;
                                                     for (var i = 0; i < pluginsArray.length; i++) {
                                                        if (pluginsArray[i].url === 'https://bylampa.github.io/start.js') {
                                                           pluginStatus = pluginsArray[i].status;
                                                           break;
                                                        }
                                                     }
                                                     if (myResult && pluginStatus !== 0) {
                                                        $('div[data-name="Start"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                     } else if (pluginStatus === 0) {
                                                        $('div[data-name="Start"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                     } else {
                                                        $('div[data-name="Start"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                     }
                                                  }, 100);
				    item.on("hover:enter", function (event) {
                                                      nthChildIndex = focus_back(event);
				    });
			}
  });
         Lampa.SettingsApi.addParam({
				component: 'add_interface_plugin',
				param: {
					name: 'goldtheme',
					type: 'select',
					values: {
						1:	'Cài đặt',
						2:	'Gỡ bỏ',
					},
				},
				field: {
					name: 'Chủ đề vàng',
					description: 'Plugin bật chủ đề vàng'
				},
				onChange: function(value) {
					if (value == '1') {
						itemON('https://bazzzilius.github.io/scripts/gold_theme.js', 'Chủ đề vàng', '@BazZziliuS', 'goldtheme', nthChildIndex);
					}
					if (value == '2') {
						var pluginToRemoveUrl = "https://bazzzilius.github.io/scripts/gold_theme.js";
						deletePlugin(pluginToRemoveUrl, nthChildIndex);
					}
				},
				onRender: function (item) {
				$('.settings-param__name', item).css('color','f3d900'); hideInstall()
				var myResult = checkPlugin('https://bazzzilius.github.io/scripts/gold_theme.js');
                                              var pluginsArray = Lampa.Storage.get('plugins');
                                                  setTimeout(function() {
                                                     $('div[data-name="goldtheme"]').append('<div class="settings-param__status one"></div>');
                                                     var pluginStatus = null;
                                                     for (var i = 0; i < pluginsArray.length; i++) {
                                                        if (pluginsArray[i].url === 'https://bazzzilius.github.io/scripts/gold_theme.js') {
                                                           pluginStatus = pluginsArray[i].status;
                                                           break;
                                                        }
                                                     }
                                                     if (myResult && pluginStatus !== 0) {
                                                        $('div[data-name="goldtheme"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                     } else if (pluginStatus === 0) {
                                                        $('div[data-name="goldtheme"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                     } else {
                                                        $('div[data-name="goldtheme"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                     }
                                                  }, 100);
		                    item.on("hover:enter", function (event) {
                                                      nthChildIndex = focus_back(event);
				    });
				}
});
       Lampa.SettingsApi.addParam({
				component: 'add_interface_plugin',
				param: {
					name: 'concert_search',
					type: 'select',
					values: {
						1:	'Cài đặt',
						2:	'Gỡ bỏ',
					},
				},
				field: {
					name: 'Tìm kiếm hòa nhạc',
					description: 'Plugin thực hiện tìm kiếm hòa nhạc thông qua trình phân tích Jackett'
				},
				onChange: function(value) {
					if (value == '1') {
						itemON('https://lampame.github.io/main/cts.js', 'Tìm kiếm hòa nhạc', '@GwynnBleiidd', 'concert_search', nthChildIndex);
					}
					if (value == '2') {
						var pluginToRemoveUrl = "https://lampame.github.io/main/cts.js";
						deletePlugin(pluginToRemoveUrl, nthChildIndex);
					}
				},
				onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
				var myResult = checkPlugin('https://lampame.github.io/main/cts.js');
                                              var pluginsArray = Lampa.Storage.get('plugins');
                                                  setTimeout(function() {
                                                     $('div[data-name="concert_search"]').append('<div class="settings-param__status one"></div>');
                                                     var pluginStatus = null;
                                                     for (var i = 0; i < pluginsArray.length; i++) {
                                                        if (pluginsArray[i].url === 'https://lampame.github.io/main/cts.js') {
                                                           pluginStatus = pluginsArray[i].status;
                                                           break;
                                                        }
                                                     }
                                                     if (myResult && pluginStatus !== 0) {
                                                        $('div[data-name="concert_search"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                     } else if (pluginStatus === 0) {
                                                        $('div[data-name="concert_search"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                     } else {
                                                        $('div[data-name="concert_search"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                     }
                                                  }, 100);
				    item.on("hover:enter", function (event) {
                                                      nthChildIndex = focus_back(event);
				    });
				}
});
     
       Lampa.SettingsApi.addParam({
				component: 'add_interface_plugin',
				param: {
					name: 'Rezka_comments',
					type: 'select',
					values: {
						1:	'Cài đặt',
						2:	'Gỡ bỏ',
					},
				},
				field: {
					name: 'Bình luận từ Rezka',
					description: 'Plugin hiển thị bình luận phim từ dịch vụ Rezka'
				},
				onChange: function(value) {
					if (value == '1') {
						itemON('https://BDVBurik.github.io/rezkacomment.js', 'Bình luận Rezka', '@BDV_Burik', 'Rezka_comments', nthChildIndex);
					}
					if (value == '2') {
						var pluginToRemoveUrl = "https://BDVBurik.github.io/rezkacomment.js";
						deletePlugin(pluginToRemoveUrl, nthChildIndex);
					}
				},
				onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
				var myResult = checkPlugin('https://BDVBurik.github.io/rezkacomment.js');
                                              var pluginsArray = Lampa.Storage.get('plugins');
                                                  setTimeout(function() {
                                                     $('div[data-name="Rezka_comments"]').append('<div class="settings-param__status one"></div>');
                                                     var pluginStatus = null;
                                                     for (var i = 0; i < pluginsArray.length; i++) {
                                                        if (pluginsArray[i].url === 'https://BDVBurik.github.io/rezkacomment.js') {
                                                           pluginStatus = pluginsArray[i].status;
                                                           break;
                                                        }
                                                     }
                                                     if (myResult && pluginStatus !== 0) {
                                                        $('div[data-name="Rezka_comments"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                     } else if (pluginStatus === 0) {
                                                        $('div[data-name="Rezka_comments"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                     } else {
                                                        $('div[data-name="Rezka_comments"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                     }
                                                  }, 100);
				    item.on("hover:enter", function (event) {
                                                      nthChildIndex = focus_back(event);
				    });
				}
});

              Lampa.SettingsApi.addParam({
				component: 'add_interface_plugin',
				param: {
					name: 'Shikimori',
					type: 'select',
					values: {
						1:	'Cài đặt',
						2:	'Gỡ bỏ',
					},
				},
				field: {
					name: 'LME Shikimori',
					description: 'Hiển thị thông tin anime từ Shikimori, cũng cố gắng tìm theo tên gốc trên TMDB, nếu tìm thấy nhiều kết quả sẽ hiển thị menu chọn'
				},
				onChange: function(value) {
					if (value == '1') {
						itemON('https://lampame.github.io/main/shikimori.js', 'LME Shikimori', '@GwynnBleiidd', 'Shikimori', nthChildIndex);
					}
					if (value == '2') {
						var pluginToRemoveUrl = "https://lampame.github.io/main/shikimori.js";
						deletePlugin(pluginToRemoveUrl, nthChildIndex);
					}
				},
				onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
				var myResult = checkPlugin('https://lampame.github.io/main/shikimori.js');
                                              var pluginsArray = Lampa.Storage.get('plugins');
                                                  setTimeout(function() {
                                                     $('div[data-name="Shikimori"]').append('<div class="settings-param__status one"></div>');
                                                     var pluginStatus = null;
                                                     for (var i = 0; i < pluginsArray.length; i++) {
                                                        if (pluginsArray[i].url === 'https://lampame.github.io/main/shikimori.js') {
                                                           pluginStatus = pluginsArray[i].status;
                                                           break;
                                                        }
                                                     }
                                                     if (myResult && pluginStatus !== 0) {
                                                        $('div[data-name="Shikimori"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                     } else if (pluginStatus === 0) {
                                                        $('div[data-name="Shikimori"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                     } else {
                                                        $('div[data-name="Shikimori"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                     }
                                                  }, 100);
				    item.on("hover:enter", function (event) {
                                                      nthChildIndex = focus_back(event);
				    });
				}
});

       Lampa.SettingsApi.addParam({
				component: 'add_interface_plugin',
				param: {
					name: 'ts_del',
					type: 'select',
					values: {
						1:	'Cài đặt',
						2:	'Gỡ bỏ',
					},
				},
				field: {
					name: 'Xóa TS',
					description: 'Plugin loại bỏ các thẻ phim có chất lượng TS trên màn hình chính'
				},
				onChange: function(value) {
					if (value == '1') {
						itemON('http://193.233.134.21/plugins/nots', 'Xóa TS', '@AndreyURL54', 'ts_del', nthChildIndex);
					}
					if (value == '2') {
						var pluginToRemoveUrl = "http://193.233.134.21/plugins/nots";
						deletePlugin(pluginToRemoveUrl, nthChildIndex);
					}
				},
				onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
				var myResult = checkPlugin('http://193.233.134.21/plugins/nots');
                                              var pluginsArray = Lampa.Storage.get('plugins');
                                                  setTimeout(function() {
                                                     $('div[data-name="ts_del"]').append('<div class="settings-param__status one"></div>');
                                                     var pluginStatus = null;
                                                     for (var i = 0; i < pluginsArray.length; i++) {
                                                        if (pluginsArray[i].url === 'http://193.233.134.21/plugins/nots') {
                                                           pluginStatus = pluginsArray[i].status;
                                                           break;
                                                        }
                                                     }
                                                     if (myResult && pluginStatus !== 0) {
                                                        $('div[data-name="ts_del"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                     } else if (pluginStatus === 0) {
                                                        $('div[data-name="ts_del"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                     } else {
                                                        $('div[data-name="ts_del"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                     }
                                                  }, 100);
				    item.on("hover:enter", function (event) {
                                                      nthChildIndex = focus_back(event);
				    });
				}
});

       Lampa.SettingsApi.addParam({
			component: 'add_interface_plugin',
			param: {
				name: 'rus_movie',
				type: 'select',
				values: {
					1:	'Cài đặt',
					2:	'Gỡ bỏ',
				},
				},
			field: {
				name: 'Phim Nga mới',
				description: 'Plugin thêm vào menu trái một mục với các phim Nga mới (phim và series) dưới dạng danh sách tổng hợp và sắp xếp theo rạp chiếu trực tuyến'
			},
			onChange: function(value) {
				if (value == '1') {
				       itemON('https://bylampa.github.io/rus_movie.js', 'Phim Nga mới', '@bylampa', 'rus_movie', nthChildIndex);
				}
				if (value == '2') {
					var pluginToRemoveUrl = "https://bylampa.github.io/rus_movie.js";
					deletePlugin(pluginToRemoveUrl, nthChildIndex);
				}
			},
	                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
				var myResult = checkPlugin('https://bylampa.github.io/rus_movie.js');
                                              var pluginsArray = Lampa.Storage.get('plugins');
                                                  setTimeout(function() {
                                                     $('div[data-name="rus_movie"]').append('<div class="settings-param__status one"></div>');
                                                     var pluginStatus = null;
                                                     for (var i = 0; i < pluginsArray.length; i++) {
                                                        if (pluginsArray[i].url === 'https://bylampa.github.io/rus_movie.js') {
                                                           pluginStatus = pluginsArray[i].status;
                                                           break;
                                                        }
                                                     }
                                                     if (myResult && pluginStatus !== 0) {
                                                        $('div[data-name="rus_movie"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                     } else if (pluginStatus === 0) {
                                                        $('div[data-name="rus_movie"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                     } else {
                                                        $('div[data-name="rus_movie"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                     }
                                                  }, 100);
				    item.on("hover:enter", function (event) {
                                                      nthChildIndex = focus_back(event);
				    });
			}
});

       Lampa.SettingsApi.addParam({
			component: 'add_interface_plugin',
			param: {
				name: 'in_qual',
				type: 'select',
				values: {
					1:	'Cài đặt',
					2:	'Gỡ bỏ',
				},
				},
			field: {
				name: 'Chất lượng cao',
				description: 'Plugin thêm vào menu trái một mục với các phim được phát hành với chất lượng cao'
			},
			onChange: function(value) {
				if (value == '1') {
				       itemON('https://bylampa.github.io/in_quality.js', 'Chất lượng cao', '@bylampa', 'in_qual', nthChildIndex);
				}
				if (value == '2') {
					var pluginToRemoveUrl = "https://bylampa.github.io/in_quality.js";
					deletePlugin(pluginToRemoveUrl, nthChildIndex);
				}
			},
	                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
				var myResult = checkPlugin('https://bylampa.github.io/in_quality.js');
                                              var pluginsArray = Lampa.Storage.get('plugins');
                                                  setTimeout(function() {
                                                     $('div[data-name="in_qual"]').append('<div class="settings-param__status one"></div>');
                                                     var pluginStatus = null;
                                                     for (var i = 0; i < pluginsArray.length; i++) {
                                                        if (pluginsArray[i].url === 'https://bylampa.github.io/in_quality.js') {
                                                           pluginStatus = pluginsArray[i].status;
                                                           break;
                                                        }
                                                     }
                                                     if (myResult && pluginStatus !== 0) {
                                                        $('div[data-name="in_qual"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                     } else if (pluginStatus === 0) {
                                                        $('div[data-name="in_qual"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                     } else {
                                                        $('div[data-name="in_qual"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                     }
                                                  }, 100);
				    item.on("hover:enter", function (event) {
                                                      nthChildIndex = focus_back(event);
				    });
			}
});

        Lampa.SettingsApi.addParam({
			component: 'add_interface_plugin',
			param: {
				name: 'snow',
				type: 'select',
				values: {
					1:	'Cài đặt',
					2:	'Gỡ bỏ',
				},
				},
			field: {
				name: 'Tuyết rơi',
				description: 'Plugin bật hiệu ứng tuyết rơi (có thể bật/tắt trong cài đặt giao diện)'
			},
			onChange: function(value) {
				if (value == '1') {
				       itemON('https://bylampa.github.io/snow.js', 'Tuyết rơi', '@bylampa', 'snow', nthChildIndex);
				}
				if (value == '2') {
					var pluginToRemoveUrl = "https://bylampa.github.io/snow.js";
					deletePlugin(pluginToRemoveUrl, nthChildIndex);
				}
			},
	                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
				var myResult = checkPlugin('https://bylampa.github.io/snow.js');
                                              var pluginsArray = Lampa.Storage.get('plugins');
                                                  setTimeout(function() {
                                                     $('div[data-name="snow"]').append('<div class="settings-param__status one"></div>');
                                                     var pluginStatus = null;
                                                     for (var i = 0; i < pluginsArray.length; i++) {
                                                        if (pluginsArray[i].url === 'https://bylampa.github.io/snow.js') {
                                                           pluginStatus = pluginsArray[i].status;
                                                           break;
                                                        }
                                                     }
                                                     if (myResult && pluginStatus !== 0) {
                                                        $('div[data-name="snow"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                     } else if (pluginStatus === 0) {
                                                        $('div[data-name="snow"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                     } else {
                                                        $('div[data-name="snow"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                     }
                                                  }, 100);
				    item.on("hover:enter", function (event) {
                                                      nthChildIndex = focus_back(event);
				    });
			}
});

       Lampa.SettingsApi.addParam({
			component: 'add_interface_plugin',
			param: {
				name: 'logo_title',
				type: 'select',
				values: {
					1:	'Cài đặt',
					2:	'Gỡ bỏ',
				},
				},
			field: {
				name: 'Logo thay vì tên',
				description: 'Cho phép thay thế tên phim/series trong thẻ bằng logo. Có thể bật/tắt trong cài đặt giao diện'
			},
			onChange: function(value) {
				if (value == '1') {
				       itemON('https://bylampa.github.io/logo_title.js', 'Logo thay vì tên', '@bylampa', 'logo_title', nthChildIndex);
				}
				if (value == '2') {
					var pluginToRemoveUrl = "https://bylampa.github.io/logo_title.js";
					deletePlugin(pluginToRemoveUrl, nthChildIndex);
				}
			},
	                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
				var myResult = checkPlugin('https://bylampa.github.io/logo_title.js');
                                              var pluginsArray = Lampa.Storage.get('plugins');
                                                  setTimeout(function() {
                                                     $('div[data-name="logo_title"]').append('<div class="settings-param__status one"></div>');
                                                     var pluginStatus = null;
                                                     for (var i = 0; i < pluginsArray.length; i++) {
                                                        if (pluginsArray[i].url === 'https://bylampa.github.io/logo_title.js') {
                                                           pluginStatus = pluginsArray[i].status;
                                                           break;
                                                        }
                                                     }
                                                     if (myResult && pluginStatus !== 0) {
                                                        $('div[data-name="logo_title"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                     } else if (pluginStatus === 0) {
                                                        $('div[data-name="logo_title"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                     } else {
                                                        $('div[data-name="logo_title"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                     }
                                                  }, 100);
				    item.on("hover:enter", function (event) {
                                                      nthChildIndex = focus_back(event);
				    });
			}
});

       Lampa.SettingsApi.addParam({
			component: 'add_interface_plugin',
			param: {
				name: 'trakt',
				type: 'select',
				values: {
					1:	'Cài đặt',
					2:	'Gỡ bỏ',
				},
				},
			field: {
				name: 'TraktTV',
				description: 'Plugin Trakt.TV cho phép người dùng lấy nội dung từ Trakt.TV trực tiếp trong ứng dụng Lampa. Với nó, bạn có thể đăng nhập, xem danh sách UpNext và Watchlist, cũng như làm mới mã thông báo đăng nhập'
			},
			onChange: function(value) {
				if (value == '1') {
				       itemON('https://lampame.github.io/main/trakttv.js', 'TraktTV', '@lme', 'trakt', nthChildIndex);
				}
				if (value == '2') {
					var pluginToRemoveUrl = "https://lampame.github.io/main/trakttv.js";
					deletePlugin(pluginToRemoveUrl, nthChildIndex);
				}
			},
	                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
				var myResult = checkPlugin('https://lampame.github.io/main/trakttv.js');
                                              var pluginsArray = Lampa.Storage.get('plugins');
                                                  setTimeout(function() {
                                                     $('div[data-name="trakt"]').append('<div class="settings-param__status one"></div>');
                                                     var pluginStatus = null;
                                                     for (var i = 0; i < pluginsArray.length; i++) {
                                                        if (pluginsArray[i].url === 'https://lampame.github.io/main/trakttv.js') {
                                                           pluginStatus = pluginsArray[i].status;
                                                           break;
                                                        }
                                                     }
                                                     if (myResult && pluginStatus !== 0) {
                                                        $('div[data-name="trakt"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                     } else if (pluginStatus === 0) {
                                                        $('div[data-name="trakt"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                     } else {
                                                        $('div[data-name="trakt"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                     }
                                                  }, 100);
				    item.on("hover:enter", function (event) {
                                                      nthChildIndex = focus_back(event);
				    });
			}
});

       Lampa.SettingsApi.addParam({
			component: 'add_interface_plugin',
			param: {
				name: 'head_filter',
				type: 'select',
				values: {
					1:	'Cài đặt',
					2:	'Gỡ bỏ',
				},
				},
			field: {
				name: 'Tùy chỉnh header',
				description: 'Thêm khả năng ẩn các phần tử trong header của ứng dụng'
			},
			onChange: function(value) {
				if (value == '1') {
				       itemON('https://and7ey.github.io/lampa/head_filter.js', 'Tùy chỉnh header', '@and7ey', 'head_filter', nthChildIndex);
				}
				if (value == '2') {
					var pluginToRemoveUrl = "https://and7ey.github.io/lampa/head_filter.js";
					deletePlugin(pluginToRemoveUrl, nthChildIndex);
				}
			},
	                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
				var myResult = checkPlugin('https://and7ey.github.io/lampa/head_filter.js');
                                              var pluginsArray = Lampa.Storage.get('plugins');
                                                  setTimeout(function() {
                                                     $('div[data-name="head_filter"]').append('<div class="settings-param__status one"></div>');
                                                     var pluginStatus = null;
                                                     for (var i = 0; i < pluginsArray.length; i++) {
                                                        if (pluginsArray[i].url === 'https://and7ey.github.io/lampa/head_filter.js') {
                                                           pluginStatus = pluginsArray[i].status;
                                                           break;
                                                        }
                                                     }
                                                     if (myResult && pluginStatus !== 0) {
                                                        $('div[data-name="head_filter"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                     } else if (pluginStatus === 0) {
                                                        $('div[data-name="head_filter"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                     } else {
                                                        $('div[data-name="head_filter"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                     }
                                                  }, 100);
				    item.on("hover:enter", function (event) {
                                                      nthChildIndex = focus_back(event);
				    });
			}
});

       Lampa.SettingsApi.addParam({
			component: 'add_interface_plugin',
			param: {
				name: 'cardify',
				type: 'select',
				values: {
					1:	'Cài đặt',
					2:	'Gỡ bỏ',
				},
				},
			field: {
				name: 'Cardify',
				description: 'Plugin biến đổi giao diện thẻ phim quen thuộc thành một giao diện mới — sáng hơn, đẹp hơn và bắt mắt hơn'
			},
			onChange: function(value) {
				if (value == '1') {
				       itemON('https://bylampa.github.io/cardify.js', 'Cardify', '@lampa', 'cardify', nthChildIndex);
				}
				if (value == '2') {
					var pluginToRemoveUrl = "https://bylampa.github.io/cardify.js";
					deletePlugin(pluginToRemoveUrl, nthChildIndex);
				}
			},
	                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
				var myResult = checkPlugin('https://bylampa.github.io/cardify.js');
                                              var pluginsArray = Lampa.Storage.get('plugins');
                                                  setTimeout(function() {
                                                     $('div[data-name="cardify"]').append('<div class="settings-param__status one"></div>');
                                                     var pluginStatus = null;
                                                     for (var i = 0; i < pluginsArray.length; i++) {
                                                        if (pluginsArray[i].url === 'https://bylampa.github.io/cardify.js') {
                                                           pluginStatus = pluginsArray[i].status;
                                                           break;
                                                        }
                                                     }
                                                     if (myResult && pluginStatus !== 0) {
                                                        $('div[data-name="cardify"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                     } else if (pluginStatus === 0) {
                                                        $('div[data-name="cardify"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                     } else {
                                                        $('div[data-name="cardify"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                     }
                                                  }, 100);
				    item.on("hover:enter", function (event) {
                                                      nthChildIndex = focus_back(event);
				    });
			}
});

       Lampa.SettingsApi.addParam({
			component: 'add_interface_plugin',
			param: {
				name: 'back_menu',
				type: 'select',
				values: {
					1:	'Cài đặt',
					2:	'Gỡ bỏ',
				},
				},
			field: {
				name: 'Menu thoát',
				description: 'Plugin thay đổi menu thoát khỏi ứng dụng bằng menu riêng với các tùy chọn có thể bật/tắt trong cài đặt ứng dụng (phần Khác, mục Menu thoát)'
			},
			onChange: function(value) {
				if (value == '1') {
				       itemON('https://bylampa.github.io/backmenu.js', 'Menu thoát', '@bylampa', 'back_menu', nthChildIndex);
				}
				if (value == '2') {
					var pluginToRemoveUrl = "https://bylampa.github.io/backmenu.js";
					deletePlugin(pluginToRemoveUrl, nthChildIndex);
				}
			},
	                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
				var myResult = checkPlugin('https://bylampa.github.io/backmenu.js');
                                              var pluginsArray = Lampa.Storage.get('plugins');
                                                  setTimeout(function() {
                                                     $('div[data-name="back_menu"]').append('<div class="settings-param__status one"></div>');
                                                     var pluginStatus = null;
                                                     for (var i = 0; i < pluginsArray.length; i++) {
                                                        if (pluginsArray[i].url === 'https://bylampa.github.io/backmenu.js') {
                                                           pluginStatus = pluginsArray[i].status;
                                                           break;
                                                        }
                                                     }
                                                     if (myResult && pluginStatus !== 0) {
                                                        $('div[data-name="back_menu"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                     } else if (pluginStatus === 0) {
                                                        $('div[data-name="back_menu"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                     } else {
                                                        $('div[data-name="back_menu"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                     }
                                                  }, 100);
				    item.on("hover:enter", function (event) {
                                                      nthChildIndex = focus_back(event);
				    });
			}
});

       Lampa.SettingsApi.addParam({
			component: 'add_interface_plugin',
			param: {
				name: 'my_themes',
				type: 'select',
				values: {
					1:	'Cài đặt',
					2:	'Gỡ bỏ',
				},
				},
			field: {
				name: 'Chủ đề của tôi',
				description: 'Plugin thay đổi bảng màu các phần tử của ứng dụng. Để cài đặt chủ đề, vào cài đặt giao diện và chọn mục Chủ đề của tôi. Để trở về giao diện chuẩn, chỉ cần gỡ bỏ bất kỳ chủ đề nào'
			},
			onChange: function(value) {
				if (value == '1') {
				       itemON('https://bylampa.github.io/themes.js', 'Chủ đề của tôi', '@bylampa', 'my_themes', nthChildIndex);
				}
				if (value == '2') {
					var pluginToRemoveUrl = "https://bylampa.github.io/themes.js";
					deletePlugin(pluginToRemoveUrl, nthChildIndex);
				}
			},
	                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
				var myResult = checkPlugin('https://bylampa.github.io/themes.js');
                                              var pluginsArray = Lampa.Storage.get('plugins');
                                                  setTimeout(function() {
                                                     $('div[data-name="my_themes"]').append('<div class="settings-param__status one"></div>');
                                                     var pluginStatus = null;
                                                     for (var i = 0; i < pluginsArray.length; i++) {
                                                        if (pluginsArray[i].url === 'https://bylampa.github.io/themes.js') {
                                                           pluginStatus = pluginsArray[i].status;
                                                           break;
                                                        }
                                                     }
                                                     if (myResult && pluginStatus !== 0) {
                                                        $('div[data-name="my_themes"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                     } else if (pluginStatus === 0) {
                                                        $('div[data-name="my_themes"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                     } else {
                                                        $('div[data-name="my_themes"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                     }
                                                  }, 100);
				    item.on("hover:enter", function (event) {
                                                      nthChildIndex = focus_back(event);
				    });
			}
});
	        Lampa.SettingsApi.addParam({
					component: 'add_interface_plugin',
					param: {
						name: 'inter_movie',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
						name: 'Bộ sưu tập quốc tế',
						description: 'Plugin thêm vào menu trái một mục với các bộ sưu tập phim quốc tế'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://bylampa.github.io/inter_movie.js', 'Bộ sưu tập quốc tế', '@bylampa', 'inter_movie', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/inter_movie.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
			                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
						var myResult = checkPlugin('https://bylampa.github.io/inter_movie.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="inter_movie"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/inter_movie.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="inter_movie"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="inter_movie"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="inter_movie"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

	        Lampa.SettingsApi.addParam({
					component: 'add_interface_plugin',
					param: {
						name: 'rate_lampa',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
						name: 'Điểm Lampa',
						description: 'Plugin thêm vào thẻ phim điểm Lampa, dựa trên đánh giá của người dùng'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://bylampa.github.io/rate_lampa.js', 'Điểm Lampa', '@AndreyURL54', 'rate_lampa', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/rate_lampa.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
			                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
						var myResult = checkPlugin('https://bylampa.github.io/rate_lampa.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="rate_lampa"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/rate_lampa.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="rate_lampa"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="rate_lampa"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="rate_lampa"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

	        Lampa.SettingsApi.addParam({
					component: 'add_interface_plugin',
					param: {
						name: 'old_cards_status',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
						name: 'Trạng thái trên thẻ cũ',
						description: 'Thêm trạng thái phim, series,... trên thẻ với phong cách cũ'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://bylampa.github.io/old_card_status.js', 'Trạng thái trên thẻ cũ', '@bylampa', 'old_cards_status', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/old_card_status.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
			                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
						var myResult = checkPlugin('https://bylampa.github.io/old_card_status.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="old_cards_status"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/old_card_status.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="old_cards_status"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="old_cards_status"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="old_cards_status"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

	        Lampa.SettingsApi.addParam({
					component: 'add_interface_plugin',
					param: {
						name: 'eps_and_seas',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
						name: 'Trạng thái series',
						description: 'Plugin hiển thị trạng thái hiện tại của series (mùa/tập). Có thể bật/tắt trong cài đặt ứng dụng'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://bylampa.github.io/seas_and_eps.js', 'Trạng thái series', '@bylampa', 'eps_and_seas', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/seas_and_eps.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
			                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
						var myResult = checkPlugin('https://bylampa.github.io/seas_and_eps.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="eps_and_seas"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/seas_and_eps.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="eps_and_seas"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="eps_and_seas"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="eps_and_seas"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

	        Lampa.SettingsApi.addParam({
					component: 'add_interface_plugin',
					param: {
						name: 'anime_tmdb',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
						name: 'Anime',
						description: 'Plugin thêm vào menu trái các bộ sưu tập anime từ TMDB'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://bylampa.github.io/anime.js', 'Anime', '@bylampa', 'anime_tmdb', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/anime.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
			                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
						var myResult = checkPlugin('https://bylampa.github.io/anime.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="anime_tmdb"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/anime.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="anime_tmdb"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="anime_tmdb"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="anime_tmdb"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

	        Lampa.SettingsApi.addParam({
					component: 'add_interface_plugin',
					param: {
						name: 'my_bookmarks',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
						name: 'Đánh dấu của tôi',
						description: 'Plugin cho phép tạo các thư mục riêng trong đánh dấu'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://bylampa.github.io/my_bookmarks.js', 'Đánh dấu của tôi', '@bylampa', 'my_bookmarks', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/my_bookmarks.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
			                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
						var myResult = checkPlugin('https://bylampa.github.io/my_bookmarks.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="my_bookmarks"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/my_bookmarks.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="my_bookmarks"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="my_bookmarks"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="my_bookmarks"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

	        Lampa.SettingsApi.addParam({
					component: 'add_interface_plugin',
					param: {
						name: 'color_vote',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
						name: 'Điểm màu',
						description: 'Plugin tô màu điểm đánh giá trên thẻ phim tùy theo giá trị'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://bylampa.github.io/color_vote.js', 'Điểm màu', '@fovway', 'color_vote', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/color_vote.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
			                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
						var myResult = checkPlugin('https://bylampa.github.io/color_vote.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="color_vote"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/color_vote.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="color_vote"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="color_vote"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="color_vote"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

	        Lampa.SettingsApi.addParam({
					component: 'add_interface_plugin',
					param: {
						name: 'tr_itunes',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
						name: 'Trailer Itunes',
						description: 'Plugin cho phép xem trailer từ Itunes trong thẻ phim'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://plugin.rootu.top/trailers.js', 'Trailer Itunes', '@rootu', 'tr_itunes', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://plugin.rootu.top/trailers.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
			                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
						var myResult = checkPlugin('https://plugin.rootu.top/trailers.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="tr_itunes"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://plugin.rootu.top/trailers.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="tr_itunes"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="tr_itunes"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="tr_itunes"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

	        Lampa.SettingsApi.addParam({
					component: 'add_interface_plugin',
					param: {
						name: 'tr_rutube',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
						name: 'Trailer Rutube',
						description: 'Plugin cho phép xem trailer từ Rutube trong thẻ phim'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://plugin.rootu.top/rutube.js', 'Trailer Rutube', '@rootu', 'tr_rutube', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://plugin.rootu.top/rutube.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
			                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
						var myResult = checkPlugin('https://plugin.rootu.top/rutube.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="tr_rutube"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://plugin.rootu.top/rutube.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="tr_rutube"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="tr_rutube"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="tr_rutube"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

	        Lampa.SettingsApi.addParam({
					component: 'add_interface_plugin',
					param: {
						name: 'surs',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
						name: 'Aviamovie Surs',
						description: 'Plugin tạo các bộ sưu tập phim và series độc đáo trên trang chính theo thể loại, dịch vụ phát trực tuyến, độ phổ biến, lượt xem và doanh thu phòng vé'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://aviamovie.github.io/surs.js', 'Aviamovie Surs', '@pilot_valliko', 'surs', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://aviamovie.github.io/surs.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
			                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
						var myResult = checkPlugin('https://aviamovie.github.io/surs.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="surs"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://aviamovie.github.io/surs.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="surs"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="surs"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="surs"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

                Lampa.SettingsApi.addParam({
					component: 'add_interface_plugin',
					param: {
						name: 'size',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
						name: 'Kích thước cố định',
						description: 'Plugin thay đổi kích thước giao diện'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://nb557.github.io/plugins/fix_size.js', 'Kích thước cố định', '@t_anton', 'size', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://nb557.github.io/plugins/fix_size.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
			                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
						var myResult = checkPlugin('https://nb557.github.io/plugins/fix_size.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="size"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://nb557.github.io/plugins/fix_size.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="size"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="size"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="size"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

	        Lampa.SettingsApi.addParam({
					component: 'add_interface_plugin',
					param: {
						name: 'stat',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
						name: 'Thống kê',
						description: 'Plugin để thống kê lịch sử xem phim trong ứng dụng, và vào cuối năm - tạo trang tổng kết năm'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://and7ey.github.io/lampa/stats.js', 'Thống kê', '@alukyanov', 'stat', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://and7ey.github.io/lampa/stats.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
			                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
						var myResult = checkPlugin('https://and7ey.github.io/lampa/stats.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="stat"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://and7ey.github.io/lampa/stats.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="stat"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="stat"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="stat"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

	        Lampa.SettingsApi.addParam({
					component: 'add_interface_plugin',
					param: {
						name: 'lable_tv',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
						name: 'Nhãn series',
						description: 'Plugin thay đổi tên nhãn trên thẻ series (từ TV thành Series)'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://bylampa.github.io/lable_serial.js', 'Nhãn series', '@bylampa', 'lable_tv', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/lable_serial.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
			                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
						var myResult = checkPlugin('https://bylampa.github.io/lable_serial.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="lable_tv"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/lable_serial.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="lable_tv"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="lable_tv"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="lable_tv"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

	        Lampa.SettingsApi.addParam({
					component: 'add_interface_plugin',
					param: {
						name: 'full_center',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
						name: 'Căn giữa thẻ',
						description: 'Plugin căn giữa các phần tử trong thẻ phim cho phiên bản di động của ứng dụng'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://bylampa.github.io/full_center.js', 'Căn giữa thẻ', '@bylampa', 'full_center', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/full_center.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
			                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
						var myResult = checkPlugin('https://bylampa.github.io/full_center.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="full_center"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/full_center.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="full_center"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="full_center"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="full_center"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

	        Lampa.SettingsApi.addParam({
					component: 'add_interface_plugin',
					param: {
						name: 'bylampa_source',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
						name: 'Nguồn ByLAMPA',
						description: 'Plugin thêm nguồn ByLAMPA, nơi bạn có thể sắp xếp/thay đổi cách hiển thị các phần theo ý thích'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://bylampa.github.io/bylampa_source.js', 'Nguồn ByLAMPA', '@bylampa', 'bylampa_source', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/bylampa_source.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
			                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
						var myResult = checkPlugin('https://bylampa.github.io/bylampa_source.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="bylampa_source"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/bylampa_source.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="bylampa_source"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="bylampa_source"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="bylampa_source"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

	        Lampa.SettingsApi.addParam({
					component: 'add_interface_plugin',
					param: {
						name: 'trailers_on_main',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
						name: 'Trailer',
						description: 'Plugin thêm vào menu chính mục Trailer với các phần khác nhau (Phim phổ biến, Đang chiếu, Sắp ra rạp, Series phổ biến, Series mới và mùa mới, Sắp chiếu trên TV)'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://mastermagic98.github.io/l_plugins/upcoming.js', 'Trailer', '@myroslav_kuzyshyn', 'trailers_on_main', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://mastermagic98.github.io/l_plugins/upcoming.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
			                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
						var myResult = checkPlugin('https://mastermagic98.github.io/l_plugins/upcoming.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="trailers_on_main"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://mastermagic98.github.io/l_plugins/upcoming.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="trailers_on_main"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="trailers_on_main"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="trailers_on_main"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

	    Lampa.SettingsApi.addParam({
					component: 'add_interface_plugin',
					param: {
						name: 'tr_off',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
						name: 'Tắt trailer',
						description: 'Plugin loại bỏ trailer trong thẻ phim'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://bylampa.github.io/trailer_off.js', 'Tắt trailer', '@bylampa', 'tr_off', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/trailer_off.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
			                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
						var myResult = checkPlugin('https://bylampa.github.io/trailer_off.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="tr_off"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/trailer_off.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="tr_off"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="tr_off"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="tr_off"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

	    Lampa.SettingsApi.addParam({
					component: 'add_interface_plugin',
					param: {
						name: 'quality',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
						name: 'Quality',
						description: 'Plugin đặt nhãn chất lượng phim trên thẻ và bên trong thẻ'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://bylampa.github.io/quality.js', 'Quality', '@bylampa', 'quality', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/quality.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
			                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
						var myResult = checkPlugin('https://bylampa.github.io/quality.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="quality"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/quality.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="quality"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="quality"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="quality"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

	    Lampa.SettingsApi.addParam({
					component: 'add_interface_plugin',
					param: {
						name: 'filter_content',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
						name: 'Lọc nội dung',
						description: 'Plugin cho phép lọc hiển thị thẻ phim trong ứng dụng thông qua cài đặt trong phần giao diện - mục Lọc nội dung'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://bylampa.github.io/filter_content.js', 'Lọc nội dung', '@bylampa', 'filter_content', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/filter_content.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
			                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
						var myResult = checkPlugin('https://bylampa.github.io/filter_content.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="filter_content"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/filter_content.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="filter_content"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="filter_content"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="filter_content"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

	    Lampa.SettingsApi.addParam({
					component: 'add_interface_plugin',
					param: {
						name: 'rate_on_main',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
						name: 'Nguồn điểm',
						description: 'Plugin thay đổi nguồn điểm trên trang chính thông qua cài đặt giao diện'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://bylampa.github.io/rate_on_main.js', 'Nguồn điểm', '@bylampa', 'rate_on_main', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/rate_on_main.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
			                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
						var myResult = checkPlugin('https://bylampa.github.io/rate_on_main.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="rate_on_main"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/rate_on_main.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="rate_on_main"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="rate_on_main"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="rate_on_main"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

	    Lampa.SettingsApi.addParam({
					component: 'add_interface_plugin',
					param: {
						name: 'orig_title',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
						name: 'Tên gốc',
						description: 'Plugin hiển thị tên gốc không dịch bên trong thẻ phim'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://bylampa.github.io/orig_title.js', 'Tên gốc', '@bylampa', 'orig_title', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/orig_title.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
			                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
						var myResult = checkPlugin('https://bylampa.github.io/orig_title.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="orig_title"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/orig_title.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="orig_title"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="orig_title"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="orig_title"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

        Lampa.SettingsApi.addParam({
					component: 'add_interface_plugin',
					param: {
						name: 'animated_reaction',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
						name: 'Phản hồi hoạt hình',
						description: 'Plugin tạo hiệu ứng hoạt hình cho phản hồi từ CUB'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://bylampa.github.io/animated_reaction.js', 'Phản hồi hoạt hình', '@AndreyURL54', 'animated_reaction', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/animated_reaction.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
			                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
						var myResult = checkPlugin('https://bylampa.github.io/animated_reaction.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="animated_reaction"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/animated_reaction.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="animated_reaction"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="animated_reaction"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="animated_reaction"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

	    Lampa.SettingsApi.addParam({
					component: 'add_interface_plugin',
					param: {
						name: 'time2end',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
						name: 'Time2end',
						description: 'Plugin hiển thị thời gian kết thúc phim trong trình phát tích hợp của Lampa'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://bylampa.github.io/time2end.js', 'Time2End', '@AndreyURL54', 'time2end', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/time2end.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
			                onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall()
						var myResult = checkPlugin('https://bylampa.github.io/time2end.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="time2end"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/time2end.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="time2end"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="time2end"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="time2end"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

        Lampa.Settings.listener.follow('open', function (e) {
					if (e.name == 'main') {
						Lampa.SettingsApi.addComponent({
							component: 'add_management_plugin',
							name: 'Quản lý'
						});
					}
		});
/* Quản lý */
		Lampa.SettingsApi.addParam({
					component: 'add_plugin',
					param: {
						name: 'add_management_plugin',
      		                        	type: 'static',
						default: true
                        		},
					field: {
                                name: icon_add_management_plugin
                        },
					onRender: function(item) {
						item.on('hover:enter', function () {
							Lampa.Settings.create('add_management_plugin');
							Lampa.Controller.enabled().controller.back = function(){
								Lampa.Settings.create('add_plugin');
							}
						});
					}
		});
      
		Lampa.SettingsApi.addParam({
					component: 'add_management_plugin',
					param: {
                               		name: 'Exit_Menu',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
                                    name: 'Thoát',
                                    description: 'Plugin thêm mục Thoát vào menu chính'
					},
					onChange: function(value) {
						if (value == '1') {
							itemON('https://tsynik.github.io/lampa/e.js', 'Thoát', '@tsynik', 'Exit_Menu', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://tsynik.github.io/lampa/e.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('https://tsynik.github.io/lampa/e.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="Exit_Menu"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://tsynik.github.io/lampa/e.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="Exit_Menu"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="Exit_Menu"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="Exit_Menu"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});
      
		Lampa.SettingsApi.addParam({
					component: 'add_management_plugin',
					param: {
                               			name: 'Hot_Buttons',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
					},
                            		field: {
                                    		name: 'Phím tắt',
                                    		description: 'Plugin gọi menu trình phát Lampa bằng các nút trên remote: 5 - danh sách phát, 8 - track âm thanh, 0 - phụ đề, channel+/- - tập tiếp theo/trước đó trong danh sách phát'
                            		},
					onChange: function(value) {
						if (value == '1') {
							itemON('https://nnmdd.github.io/lampa_hotkeys/hotkeys.js', 'Phím tắt', '@nnmd', 'Hot_Buttons', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://nnmdd.github.io/lampa_hotkeys/hotkeys.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('https://nnmdd.github.io/lampa_hotkeys/hotkeys.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="Hot_Buttons"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://nnmdd.github.io/lampa_hotkeys/hotkeys.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="Hot_Buttons"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="Hot_Buttons"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="Hot_Buttons"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});
      
		Lampa.SettingsApi.addParam({
					component: 'add_management_plugin',
					param: {
						name: 'DLNA',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
                                    		name: 'DLNA (Tizen, Orsay)',
                                    		description: 'Plugin hoạt động trên thiết bị Orsay, đối với Tizen cần cập nhật widget lên phiên bản 1.9.1'
					},
					onChange: function(value) {
						if (value == '1') {
							itemON('https://bylampa.github.io/dlna.js', 'DLNA', '@lampa', 'DLNA', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/dlna.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('https://bylampa.github.io/dlna.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="DLNA"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/dlna.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="DLNA"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="DLNA"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="DLNA"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});
	        Lampa.SettingsApi.addParam({
					component: 'add_management_plugin',
					param: {
						name: 'Select_Weapon',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
                                    		name: 'Loại điều khiển',
                                    		description: 'Plugin khi cài đặt cho phép chọn loại điều khiển (Remote không chuột, Remote có chuột, Cảm ứng), cũng như đặt lại loại điều khiển đã chọn trước đó'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://nemiroff.github.io/lampa/select_weapon.js', 'Loại điều khiển', '@nemiroff', 'Select_Weapon', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://nemiroff.github.io/lampa/select_weapon.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('https://nemiroff.github.io/lampa/select_weapon.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="Select_Weapon"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://nemiroff.github.io/lampa/select_weapon.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="Select_Weapon"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="Select_Weapon"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="Select_Weapon"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});
	        Lampa.SettingsApi.addParam({
					component: 'add_management_plugin',
					param: {
						name: 'Touch_off',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
                                    		name: 'Tắt cảm ứng',
                                    		description: 'Plugin tắt điều khiển cảm ứng nếu nó đã được bật do nhầm lẫn'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://nb557.github.io/plugins/not_mobile.js', 'Tắt cảm ứng', '@t_anton', 'Touch_off', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://nb557.github.io/plugins/not_mobile.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('https://nb557.github.io/plugins/not_mobile.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="Touch_off"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://nb557.github.io/plugins/not_mobile.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="Touch_off"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="Touch_off"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="Touch_off"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});
	        Lampa.SettingsApi.addParam({
					component: 'add_management_plugin',
					param: {
						name: 'Wsoff',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
                                    		name: 'Wsoff',
                                    		description: 'Plugin tắt lỗi (Request was denied for security) trên các phiên bản Android cũ. Không cài đặt nếu không có lỗi'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('http://plugin.rootu.top/wsoff.js', 'Wsoff', '@rootu', 'Wsoff', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "http://plugin.rootu.top/wsoff.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('http://plugin.rootu.top/wsoff.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="Wsoff"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'http://plugin.rootu.top/wsoff.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="Wsoff"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="Wsoff"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="Wsoff"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});
	        Lampa.SettingsApi.addParam({
					component: 'add_management_plugin',
					param: {
						name: 'Redirect',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
                                    		name: 'Đổi server',
                                    		description: 'Plugin cho phép thay đổi server của ứng dụng'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://bylampa.github.io/redirect.js', 'Đổi server', '@scabrum', 'Redirect', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/redirect.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('https://bylampa.github.io/redirect.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="Redirect"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/redirect.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="Redirect"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="Redirect"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="Redirect"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});
	       
	        Lampa.SettingsApi.addParam({
					component: 'add_management_plugin',
					param: {
						name: 'setprotect',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
						name: 'Truy cập cài đặt',
						description: 'Plugin khóa truy cập cài đặt bằng mật khẩu đã nhập khi kích hoạt mục tương ứng trong menu cài đặt kiểm soát của phụ huynh'
					},
					onChange: function(value) {
						if (value == '1') {
							itemON('http://193.233.134.21/plugins/setprotect', 'Truy cập cài đặt', '@AndreyURL54', 'setprotect', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "http://193.233.134.21/plugins/setprotect";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}	
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900');  hideInstall()
						var myResult = checkPlugin('http://193.233.134.21/plugins/setprotect');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="setprotect"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'http://193.233.134.21/plugins/setprotect') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="setprotect"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="setprotect"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="setprotect"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

	        Lampa.SettingsApi.addParam({
					component: 'add_management_plugin',
					param: {
						name: 'Sort_mainmenu',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
						name: 'Sắp xếp menu chính',
						description: 'Plugin cho phép tùy chỉnh menu chính (ẩn, di chuyển các mục menu). Hoạt động trên thiết bị cảm ứng'
					},
					onChange: function(value) {
						if (value == '1') {
							itemON('http://193.233.134.21/plugins/menusort', 'Sắp xếp menu chính', '@AndreyURL54', 'Sort_mainmenu', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "http://193.233.134.21/plugins/menusort";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}	
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900');  hideInstall()
						var myResult = checkPlugin('http://193.233.134.21/plugins/menusort');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="Sort_mainmenu"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'http://193.233.134.21/plugins/menusort') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="Sort_mainmenu"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="Sort_mainmenu"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="Sort_mainmenu"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

	        Lampa.SettingsApi.addParam({
					component: 'add_management_plugin',
					param: {
						name: 'bind_but',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
						name: 'Gán nút',
						description: 'Plugin cho phép điều khiển bằng các nút màu trên remote TV với các bộ lọc trong thẻ phim trực tuyến hoặc torrent'
					},
					onChange: function(value) {
						if (value == '1') {
							itemON('https://apxubatop.github.io/lmpPlugs/tvbuttontst.js', 'Gán nút', '@Juri_Z', 'bind_but', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://apxubatop.github.io/lmpPlugs/tvbuttontst.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}	
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900');  hideInstall()
						var myResult = checkPlugin('https://apxubatop.github.io/lmpPlugs/tvbuttontst.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="bind_but"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://apxubatop.github.io/lmpPlugs/tvbuttontst.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="bind_but"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="bind_but"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="bind_but"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

                Lampa.SettingsApi.addParam({
					component: 'add_management_plugin',
					param: {
						name: 'infuse_save',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
                                    		name: 'Infuse save',
                                    		description: 'Plugin để lưu torrent, thông qua Torrserver vào Infuse. Được cài đặt sẵn, không có cấu hình. Gọi bằng cách nhấn giữ trong danh sách file'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://lampame.github.io/main/infuseSave.js', 'Infuse Save', '@lme', 'infuse_save', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://lampame.github.io/main/infuseSave.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('https://lampame.github.io/main/infuseSave.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="infuse_save"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://lampame.github.io/main/infuseSave.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="infuse_save"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="infuse_save"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="infuse_save"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

                Lampa.SettingsApi.addParam({
					component: 'add_management_plugin',
					param: {
						name: 'cub_sync',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
                                    		name: 'CUB Sync',
                                    		description: 'Đồng bộ đánh dấu và lịch sử với CUB vào bộ nhớ cục bộ của ứng dụng'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://bylampa.github.io/cub_sync.js', 'CUB Sync', '@levende', 'cub_sync', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/cub_sync.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('https://bylampa.github.io/cub_sync.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="cub_sync"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/cub_sync.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="cub_sync"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="cub_sync"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="cub_sync"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

	    Lampa.SettingsApi.addParam({
					component: 'add_management_plugin',
					param: {
						name: 'Reload',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
                                    		name: 'Tải lại ứng dụng',
                                    		description: 'Plugin tạo biểu tượng trên thanh trên cùng để tải lại ứng dụng'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://bylampa.github.io/reload.js', 'Tải lại ứng dụng', '@bylampa', 'Reload', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/reload.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('https://bylampa.github.io/reload.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="Reload"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/reload.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="Reload"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="Reload"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="Reload"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

	    Lampa.SettingsApi.addParam({
					component: 'add_management_plugin',
					param: {
						name: 'sort_main_menu',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
                                    		name: 'Sort main menu',
                                    		description: 'Một plugin khác để sắp xếp menu chính. Cài đặt nằm trong phần giao diện, mục - Quản lý menu chính'
					},
					onChange: function(value) {
						if (value == '1') {
						       itemON('https://bylampa.github.io/sort_main_menu.js', 'Sort Main Menu', '@bylampa', 'sort_main_menu', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/sort_main_menu.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('https://bylampa.github.io/sort_main_menu.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="sort_main_menu"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/sort_main_menu.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="sort_main_menu"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="sort_main_menu"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="sort_main_menu"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

	    Lampa.SettingsApi.addParam({
					component: 'add_management_plugin',
					param: {
						name: 'speedtest',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
						},
					field: {
						name: 'Speedtest',
						description: 'Plugin tạo nút trên thanh trên cùng để đo tốc độ internet'
					},
					onChange: function(value) {
						if (value == '1') {
							itemON('https://bylampa.github.io/speedtest.js', 'Speedtest', '@AndreyURL54', 'speedtest', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/speedtest.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}	
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900');  hideInstall()
						var myResult = checkPlugin('https://bylampa.github.io/speedtest.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="speedtest"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/speedtest.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="speedtest"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="speedtest"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="speedtest"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});
	
        Lampa.Settings.listener.follow('open', function (e) {
					if (e.name == 'main') {
						Lampa.SettingsApi.addComponent({
							component: 'add_online_plugin',
							name: 'Trực tuyến'
						});
					}
		});
/* Trực tuyến */
		Lampa.SettingsApi.addParam({
					component: 'add_plugin',
					param: {
						name: 'add_online_plugin',
						type: 'static',
						default: true
                          		},
					field: {
						name: icon_add_online_plugin
                          		},
					onRender: function(item) {
						item.on('hover:enter', function () {
							Lampa.Settings.create('add_online_plugin');
							Lampa.Controller.enabled().controller.back = function(){
								Lampa.Settings.create('add_plugin');
							}
						});
					}
		});
                
		Lampa.SettingsApi.addParam({
					component: 'add_online_plugin',
					param: {
                                		name: 'Online_Mod',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
					},
              				},
					field: {
						name: 'Online_Mod',
						description: 'Plugin cho phép xem phim và series trực tuyến. Có 7 máy chủ để lựa chọn'
					},
					onChange: function(value) {
						if (value == '1') {
							itemON('https://bylampa.github.io/online_mod.js', 'Online Mod', '@t_anton', 'Online_Mod', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/online_mod.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('https://bylampa.github.io/online_mod.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="Online_Mod"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/online_mod.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="Online_Mod"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="Online_Mod"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="Online_Mod"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
        });
       
		Lampa.SettingsApi.addParam({
					component: 'add_online_plugin',
					param: {
                                		name: 'Online_Prestige',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
					},
					},
					field: {
						name: 'Online Filmix',
						description: 'Plugin trực tuyến với một nguồn Filmix (hoạt động với tài khoản riêng)'
					},
					onChange: function(value) {
						if (value == '1') {
							itemON('https://bylampa.github.io/fx.js', 'Online Filmix', '@rik', 'Online_Prestige', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/fx.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
               },
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('https://bylampa.github.io/fx.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="Online_Prestige"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/fx.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="Online_Prestige"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="Online_Prestige"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="Online_Prestige"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
        });
       
		Lampa.SettingsApi.addParam({
					component: 'add_online_plugin',
					param: {
                               			name: 'online_cinema',
                   				type: 'select',
                   				values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
                   				},
               				},
					field: {
                                  		name: 'Online Cinema',
                                  		description: 'Plugin để xem phim và series trực tuyến'
					},
                           		onChange: function(value) {
					if (value == '1') {
						itemON('https://bylampa.github.io/cinema.js', 'Online Cinema', '@cinema', 'online_cinema', nthChildIndex);
					}
					if (value == '2') {
						var pluginToRemoveUrl = "https://bylampa.github.io/cinema.js";
						deletePlugin(pluginToRemoveUrl, nthChildIndex);
					}
                },
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('https://bylampa.github.io/cinema.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="online_cinema"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/cinema.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="online_cinema"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="online_cinema"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="online_cinema"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});
	        
	        Lampa.SettingsApi.addParam({
					component: 'add_online_plugin',
					param: {
                               			name: 'Showy',
                   				type: 'select',
                   				values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
                   				},
               				},
					field: {
                                  		name: 'Showy',
                                  		description: 'Plugin để xem phim và series trực tuyến'
					},
                           		onChange: function(value) {
					if (value == '1') {
						itemON('http://showwwy.com/m.js', 'Showy', '@showy', 'Showy', nthChildIndex);
					}
					if (value == '2') {
						var pluginToRemoveUrl = "http://showwwy.com/m.js";
						deletePlugin(pluginToRemoveUrl, nthChildIndex);
					}
                },
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('http://showwwy.com/m.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="Showy"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'http://showwwy.com/m.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="Showy"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="Showy"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="Showy"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);	
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

	        Lampa.SettingsApi.addParam({
					component: 'add_online_plugin',
					param: {
                               			name: 'smotret_eu',
                   				type: 'select',
                   				values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
                   				},
               				},
					field: {
                                  		name: 'Smotret EU',
                                  		description: 'Plugin để xem phim và series trực tuyến, sử dụng một nguồn ổn định. Phù hợp hơn cho khu vực gần Hà Lan'
					},
                           		onChange: function(value) {
					if (value == '1') {
						itemON('http://smotret24.com/online.js', 'Smotret EU', '@showy', 'smotret_eu', nthChildIndex);
					}
					if (value == '2') {
						var pluginToRemoveUrl = "http://smotret24.com/online.js";
						deletePlugin(pluginToRemoveUrl, nthChildIndex);
					}
                },
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('http://smotret24.com/online.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="smotret_eu"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'http://smotret24.com/online.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="smotret_eu"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="smotret_eu"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="smotret_eu"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);	
					            item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

                Lampa.SettingsApi.addParam({
					component: 'add_online_plugin',
					param: {
                               			name: 'smotret_4k',
                   				type: 'select',
                   				values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
                   				},
               				},
					field: {
                                  		name: 'Smotret 4K',
                                  		description: 'Plugin để xem phim và series trực tuyến, sử dụng một nguồn ổn định với chất lượng 4K'
					},
                           		onChange: function(value) {
					if (value == '1') {
						itemON('http://smotretk.com/online.js', 'Smotret 4K', '@showy', 'smotret_4k', nthChildIndex);
					}
					if (value == '2') {
						var pluginToRemoveUrl = "http://smotretk.com/online.js";
						deletePlugin(pluginToRemoveUrl, nthChildIndex);
					}
                },
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('http://smotretk.com/online.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="smotret_4k"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'http://smotretk.com/online.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="smotret_4k"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="smotret_4k"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="smotret_4k"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});
	
/* Torrent */
		Lampa.Settings.listener.follow('open', function (e) {
					if (e.name == 'main') {
						Lampa.SettingsApi.addComponent({
							component: 'add_torrent_plugin',
							name: 'Torrent'
						});
					}
		});
                    
		Lampa.SettingsApi.addParam({
					component: 'add_plugin',
					param: {
                                   		name: 'add_torrent_plugin',
                                   		type: 'static',
                                   		default: true
                           		},
					field: {
                                   		name: icon_add_torrent_plugin
                           		},
					onRender: function(item) {
						item.on('hover:enter', function () {
							Lampa.Settings.create('add_torrent_plugin');
							Lampa.Controller.enabled().controller.back = function(){
								Lampa.Settings.create('add_plugin');
							}
						});
					}
		});
                    
		Lampa.SettingsApi.addParam({
					component: 'add_torrent_plugin',
					param: {
						name: 'Switch_Parser',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
                  			},
					field: {
						name: 'Chuyển đổi trình phân tích',
						description: 'Plugin cho phép chuyển đổi giữa các trình phân tích jackett từ danh sách đã có sẵn các tham số đúng. Trong cài đặt trình phân tích sẽ xuất hiện mục với danh sách các jackett công khai'
					},
					onChange: function(value) {
						if (value == '1') {
							itemON('https://bylampa.github.io/jackett.js', 'Chuyển đổi trình phân tích', '@AndreyURL54', 'Switch_Parser', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/jackett.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('https://bylampa.github.io/jackett.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="Switch_Parser"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/jackett.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="Switch_Parser"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="Switch_Parser"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="Switch_Parser"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);	
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});
        
		Lampa.SettingsApi.addParam({
					component: 'add_torrent_plugin',
					param: {
						name: 'Tracks',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
					},
					field: {
						name: 'Tracks',
						description: 'Plugin thay đổi tên track âm thanh và phụ đề trong trình phát (chỉ hoạt động với torrent)'
					},
					onChange: function(value) {
						if (value == '1') {
							itemON('https://bylampa.github.io/tracks.js', 'Tracks', '@lampa', 'Tracks', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/tracks.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('https://bylampa.github.io/tracks.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="Tracks"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/tracks.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="Tracks"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="Tracks"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="Tracks"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

	        Lampa.SettingsApi.addParam({
					component: 'add_torrent_plugin',
					param: {
						name: 'Setting_torrents',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
					},
					field: {
						name: 'Cài đặt torrent (Web OS, Tizen)',
						description: 'Plugin dành cho TV, nơi Lampa được cài đặt qua cửa hàng chính thức LG Store và Tizen App Store. Bật trong cài đặt hiển thị các mục Parser và Torrserver, cần thiết để xem torrent'
					},
					onChange: function(value) {
						if (value == '1') {
							itemON('https://bylampa.github.io/etor.js', 'Cài đặt torrent', '@lampa', 'Setting_torrents', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/etor.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
                                                }
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('https://bylampa.github.io/etor.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="Setting_torrents"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/etor.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="Setting_torrents"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="Setting_torrents"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="Setting_torrents"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});
	        Lampa.SettingsApi.addParam({
					component: 'add_torrent_plugin',
					param: {
						name: 'Check_server',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
					},
					field: {
						name: 'Tìm TorrServer cục bộ',
						description: 'Plugin cho phép tìm TorrServer cục bộ của bạn'
					},
					onChange: function(value) {
						if (value == '1') {
							itemON('http://193.233.134.21/plugins/checker.js', 'Tìm TorrServer cục bộ', '@AndreyURL54', 'Check_server', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "http://193.233.134.21/plugins/checker.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
                                                }
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('http://193.233.134.21/plugins/checker.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="Check_server"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'http://193.233.134.21/plugins/checker.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="Check_server"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="Check_server"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="Check_server"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);	
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});
	         Lampa.SettingsApi.addParam({
					component: 'add_torrent_plugin',
					param: {
						name: 'Torr_download',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
					},
					field: {
						name: 'Tải torrent',
						description: 'Plugin thêm kết nối các trình torrent client như qBittorent, Transmission với khả năng tải torrent qua nó để xem cục bộ'
					},
					onChange: function(value) {
						if (value == '1') {
							itemON('https://lampame.github.io/main/torrentmanager/torrentmanager.js', 'Tải torrent', '@feliks', 'Torr_download', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://lampame.github.io/main/torrentmanager/torrentmanager.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
                                                }
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('https://lampame.github.io/main/torrentmanager/torrentmanager.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="Torr_download"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://lampame.github.io/main/torrentmanager/torrentmanager.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="Torr_download"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="Torr_download"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="Torr_download"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);	
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});
	        Lampa.SettingsApi.addParam({
					component: 'add_torrent_plugin',
					param: {
						name: 'second_but_torrents',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
					},
					field: {
						name: 'Nút Torrent thứ hai',
						description: 'Plugin thêm nút Torrent thứ hai'
					},
					onChange: function(value) {
						if (value == '1') {
							itemON('https://github.freebie.tom.ru/torrents.js', 'Nút Torrent thứ hai', '@VitalikPVA', 'second_but_torrents', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://github.freebie.tom.ru/torrents.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
                                                }
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('https://github.freebie.tom.ru/torrents.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="second_but_torrents"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://github.freebie.tom.ru/torrents.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="second_but_torrents"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="second_but_torrents"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="second_but_torrents"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);	
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});
	        Lampa.SettingsApi.addParam({
					component: 'add_torrent_plugin',
					param: {
						name: 'free_torr',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
					},
					field: {
						name: 'Free Torrserver',
						description: 'Plugin tự động cung cấp torrserver từ cơ sở dữ liệu của nó'
					},
					onChange: function(value) {
						if (value == '1') {
							itemON('https://bylampa.github.io/freetorr.js', 'Free Torrserver', '@scabrum', 'free_torr', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/freetorr.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
                                                }
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('https://bylampa.github.io/freetorr.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="free_torr"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/freetorr.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="free_torr"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="free_torr"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="free_torr"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

	        Lampa.SettingsApi.addParam({
					component: 'add_torrent_plugin',
					param: {
						name: 'visual_ts',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
					},
					field: {
						name: 'Trực quan hóa tải TS',
						description: 'Plugin hiển thị trực quan quá trình tải TS trước khi phát video qua torrent'
					},
					onChange: function(value) {
						if (value == '1') {
							itemON('https://plugin.rootu.top/ts-preload.js', 'Trực quan hóa tải TS', '@rootu', 'visual_ts', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://plugin.rootu.top/ts-preload.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
                                                }
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('https://plugin.rootu.top/ts-preload.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="visual_ts"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://plugin.rootu.top/ts-preload.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="visual_ts"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="visual_ts"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="visual_ts"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});
	
		Lampa.Settings.listener.follow('open', function (e) {
					if (e.name == 'main') {
						Lampa.SettingsApi.addComponent({
							component: 'add_tv_plugin',
							name: 'TV'
						});
					}
		});
/* TV */
		Lampa.SettingsApi.addParam({
					component: 'add_plugin',
					param: {
						name: 'add_tv_plugin',
						type: 'static',
						default: true
					},
					field: {
						name: icon_add_tv_plugin
					},
					onRender: function(item) {
						item.on('hover:enter', function () {
							Lampa.Settings.create('add_tv_plugin');
							Lampa.Controller.enabled().controller.back = function(){
								Lampa.Settings.create('add_plugin');
							}
						});
					}
		});
	
		Lampa.SettingsApi.addParam({
					component: 'add_tv_plugin',
					param: {
						name: 'Diesel',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
					},
					field: {
						name: 'Diesel TV',
						description: 'Plugin để xem miễn phí các kênh TV và danh sách phát thương mại với chương trình TV và ghi hình lưu trữ'
					},
					onChange: function(value) {
						if (value == '1') {
							itemON('https://andreyurl54.github.io/diesel5/diesel.js', 'Diesel TV', '@AndreyURL54', 'Diesel', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://andreyurl54.github.io/diesel5/diesel.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('https://andreyurl54.github.io/diesel5/diesel.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="Diesel"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://andreyurl54.github.io/diesel5/diesel.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="Diesel"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="Diesel"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="Diesel"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});
	
		Lampa.SettingsApi.addParam({
					component: 'add_tv_plugin',
					param: {
						name: 'Kulik',
                        			type: 'select',
                        			values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
                        		},
					},
					field: {
						name: 'Kulik',
						description: 'Plugin để xem các kênh IPTV, được sắp xếp theo nhiều danh mục khác nhau. Có thể thay đổi phong cách plugin, máy chủ phát sóng, cũng như thêm kênh vào mục yêu thích'
					},
					onChange: function(value) {
						if (value == '1') {
							itemON('http://cdn.kulik.uz/cors', 'Kulik TV', '@SawamuraRen', 'Kulik', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "http://cdn.kulik.uz/cors";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('http://cdn.kulik.uz/cors');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="Kulik"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'http://cdn.kulik.uz/cors') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="Kulik"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="Kulik"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="Kulik"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

		Lampa.SettingsApi.addParam({
					component: 'add_tv_plugin',
					param: {
						name: 'IPTV',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
					},
					field: {
							name: 'IPTV',
							description: 'Plugin để xem các kênh IPTV. Sắp xếp kênh theo nhóm và khả năng thêm kênh vào mục yêu thích. Chỉ hoạt động với danh sách phát của riêng bạn, được thêm trên trang https://cub.watch/iptv'
					},
					onChange: function(value) {
						if (value == '1') {
							itemON('http://cub.red/plugin/iptv', 'IPTV', '@lampa', 'IPTV', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "http://cub.red/plugin/iptv";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('http://cub.red/plugin/iptv');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="IPTV"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'http://cub.red/plugin/iptv') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="IPTV"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="IPTV"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="IPTV"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});
	        Lampa.SettingsApi.addParam({
					component: 'add_tv_plugin',
					param: {
						name: 'Hack_TV',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
					},
					field: {
							name: 'Hack TV',
							description: 'Plugin để xem các kênh IPTV'
					},
					onChange: function(value) {
						if (value == '1') {
							itemON('https://bylampa.github.io/tv.js', 'Hack TV', '@scabrum', 'Hack_TV', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/tv.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('https://bylampa.github.io/tv.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="Hack_TV"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/tv.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="Hack_TV"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="Hack_TV"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="Hack_TV"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);	
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});
	
		Lampa.Settings.listener.follow('open', function (e) {
					if (e.name == 'main') {
						Lampa.SettingsApi.addComponent({
							component: 'add_radio_plugin',
							name: 'Radio'
						});
					}
		});
/* Radio */
		Lampa.SettingsApi.addParam({
					component: 'add_plugin',
					param: {
						name: 'add_radio_plugin',
						type: 'static',
					default: true
                         		},
					field: {
						name: icon_add_radio_plugin
                         		},
					onRender: function(item) {
						item.on('hover:enter', function () {
							Lampa.Settings.create('add_radio_plugin');
							Lampa.Controller.enabled().controller.back = function(){
								Lampa.Settings.create('add_plugin');
							}
						});
					}
		});
	
		Lampa.SettingsApi.addParam({
					component: 'add_radio_plugin',
					param: {
						name: 'Record',
                        			type: 'select',
                        			values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
                        			},
					},
					field: {
						name: 'Radio Record',
						description: 'Nghe radio từ đài phát thanh Radio Record. Có hơn 50 thể loại, sẽ tìm được gu của bạn'
					},
					onChange: function(value) {
						if (value == '1') {
							itemON('http://cub.red/plugin/radio', 'Radio Record', '@lampa', 'Record', nthChildIndex);
						}
						if (value == '2') {
							var pluginToRemoveUrl = "http://cub.red/plugin/radio";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('http://cub.red/plugin/radio');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="Record"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'http://cub.red/plugin/radio') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="Record"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="Record"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="Record"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);	
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});
	
		Lampa.SettingsApi.addParam({
					component: 'add_radio_plugin',
					param: {
						name: 'Record_Mod',
       				                type: 'select',
                       				values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
                        			},
					},
					field: {
						name: 'Radio Record Mod',
						description: 'Vẫn là plugin Radio Record, nhưng với một danh sách đài duy nhất không phân chia theo thể loại'
					},
					onChange: function(value) {
                        			if (value == '1') {
							itemON('https://lampame.github.io/main/rradio.js', 'Radio Record Mod', '@GwynnBleiidd', 'Record_Mod', nthChildIndex);
                     				}
						if (value == '2') {
							var pluginToRemoveUrl = "https://lampame.github.io/main/rradio.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
                                        },
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('https://lampame.github.io/main/rradio.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="Record_Mod"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://lampame.github.io/main/rradio.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="Record_Mod"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="Record_Mod"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="Record_Mod"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});

	        Lampa.SettingsApi.addParam({
					component: 'add_radio_plugin',
					param: {
						name: 'Radio_Soma',
       				                type: 'select',
                       				values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
                        			},
					},
					field: {
						name: 'Radio SomaFM',
						description: 'Hơn 30 kênh phát thanh độc đáo/alternative trên toàn thế giới, được hỗ trợ bởi người nghe, không quảng cáo.'
					},
					onChange: function(value) {
                        			if (value == '1') {
							itemON('https://tsynik.github.io/lampa/soma.js', 'Radio SomaFM', '@tsynik', 'Radio_Soma', nthChildIndex);
                     				}
						if (value == '2') {
							var pluginToRemoveUrl = "https://tsynik.github.io/lampa/soma.js";
							deletePlugin(pluginToRemoveUrl, nthChildIndex);
						}
                                        },
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('https://tsynik.github.io/lampa/soma.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="Radio_Soma"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://tsynik.github.io/lampa/soma.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="Radio_Soma"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="Radio_Soma"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="Radio_Soma"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);
						    item.on("hover:enter", function (event) {
                                                        nthChildIndex = focus_back(event);
						    });
					}
		});
/* 18+ */
		Lampa.Settings.listener.follow('open', function (e) {
					if (e.name == 'main') {
						Lampa.SettingsApi.addComponent({
                            component: 'add_sisi_plugin',
							name: '18+'
						});
					}
		});
	
		Lampa.SettingsApi.addParam({
					component: 'add_plugin',
					param: {
						name: 'add_sisi_plugin',
						type: 'static',
						default: true
					},
					field: {
						name: icon_add_sisi_plugin
					},
					onRender: function(item) {
						item.on('hover:enter', function () {
							Lampa.Settings.create('add_sisi_plugin');
							Lampa.Controller.enabled().controller.back = function(){
								Lampa.Settings.create('add_plugin');
							}
						});
					}
		});
	
                Lampa.SettingsApi.addParam({
					component: 'add_sisi_plugin',
					param: {
						name: 'sisi_durex',
						type: 'select',
						values: {
							1:	'Cài đặt',
							2:	'Gỡ bỏ',
						},
					},
					field: {
						name: '18+',
						description: 'Plugin để xem nội dung 18+'
					},
					onChange: function(value) {
						if (value == '1') {
							itemON('https://bylampa.github.io/sisi.js', '18+', '@rik', 'sisi_durex');
						}
						if (value == '2') {
							var pluginToRemoveUrl = "https://bylampa.github.io/sisi.js";
							deletePlugin(pluginToRemoveUrl);
						}
					},
					onRender: function (item) {$('.settings-param__name', item).css('color','f3d900'); hideInstall();
						var myResult = checkPlugin('https://bylampa.github.io/sisi.js');
                                                var pluginsArray = Lampa.Storage.get('plugins');
                                                    setTimeout(function() {
                                                       $('div[data-name="sisi_durex"]').append('<div class="settings-param__status one"></div>');
                                                       var pluginStatus = null;
                                                       for (var i = 0; i < pluginsArray.length; i++) {
                                                          if (pluginsArray[i].url === 'https://bylampa.github.io/sisi.js') {
                                                             pluginStatus = pluginsArray[i].status;
                                                             break;
                                                          }
                                                       }
                                                       if (myResult && pluginStatus !== 0) {
                                                          $('div[data-name="sisi_durex"]').find('.settings-param__status').removeClass('active error').addClass('active');
                                                       } else if (pluginStatus === 0) {
                                                          $('div[data-name="sisi_durex"]').find('.settings-param__status').removeClass('active error').css('background-color', 'rgb(255, 165, 0)');
                                                       } else {
                                                          $('div[data-name="sisi_durex"]').find('.settings-param__status').removeClass('active error').addClass('error');
                                                       }
                                                    }, 100);	
					}
		});
	
/* Quảng cáo */
      Lampa.SettingsApi.addParam({
					component: 'add_plugin',
					param: {
						name: 'add_ads',
      		                        	type: 'title'
                        		},
					field: {
                                            name: ads
                                        },
                                        onRender: function (item) {
                                            setTimeout(function() {
                                               $('.settings-param-title').insertAfter($('.settings-param').last())
                                            },0);
                                        }
         });	

	 Lampa.Settings.listener.follow('open', function(e) {
	    if (e.name == 'add_plugin') {
                setTimeout(function() {
			        if (document.querySelector("div > span > div > span")) {
					if (document.querySelector("div > span > div > span").innerText == '@lampa_plugins_uncensored') {
						$('div > span:contains("Еще")').parent().remove()
						$('div > span:contains("Редактировать")').parent().remove()
						$('div > span:contains("История")').parent().remove()
						$('div > span:contains("Статус")').parent().remove()
					}
				}
                }, 0);
            }
	   
        });
/* Yandex counter */   
	(function(m, e, t, r, i, k, a) {
                       m[i] = m[i] || function() {
                               (m[i].a = m[i].a || []).push(arguments)
                       };
                       m[i].l = 1 * new Date();
                       for(var j = 0; j < document.scripts.length; j++) {
                               if(document.scripts[j].src === r) {
                                       return;
                               }
                       }
                       k = e.createElement(t), a = e.getElementsByTagName(t)[0], k.async = 1, k.src = r, a.parentNode.insertBefore(k, a)
    })
    (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
    ym(93937344, "init", {clickmap: true,trackLinks: true,accurateTrackBounce: true})
    var METRIKA = '<noscript><div><img src="https://mc.yandex.ru/watch/93937344" style="position:absolute; left:-9999px;" alt="" /></div></noscript>';
    $('body').append(METRIKA);

} // /* addonStart */

if (!!window.appready) addonStart();
else Lampa.Listener.follow('app', function(e){if (e.type === 'ready') addonStart()});	

})();