"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import tripManifest from "../public/trips/manifest.json";

type Photo = { id: string; filename: string; url: string; sortOrder: number; bundled?: boolean };
type Location = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  stopOrder: number;
  photos: Photo[];
};

const fallbackLocations: Location[] = [
  { id: "sydney", name: "悉尼", subtitle: "Sydney · Australia", description: "故事从悉尼开始。海风、阳光，还有我们第一次一起出发的期待。", stopOrder: 1, photos: [] },
  { id: "vanuatu", name: "瓦努阿图", subtitle: "Vanuatu", description: "在南太平洋的蓝色里，把快乐踩成一串小小的浪花。", stopOrder: 2, photos: [] },
  { id: "new-zealand", name: "新西兰", subtitle: "New Zealand", description: "山、云和草地都很近，我们一起收集了好多绿色的记忆。", stopOrder: 3, photos: [] },
  { id: "japan", name: "日本", subtitle: "Japan", description: "小街、列车和甜甜的点心，组成了闪闪发光的一站。", stopOrder: 4, photos: [] },
  { id: "thailand", name: "泰国", subtitle: "Thailand", description: "热带的风吹过来，连笑声都变得暖暖的。", stopOrder: 5, photos: [] },
  { id: "hong-kong", name: "香港", subtitle: "Hong Kong", description: "城市的灯亮起来，我们的星星旅程也多了一颗新收藏。", stopOrder: 6, photos: [] },
];

const bundledPhotos = tripManifest as Record<string, string[]>;

function addBundledPhotos(location: Location): Location {
  const localPhotos = (bundledPhotos[location.id] ?? []).map((url, index) => ({
    id: `memory-${location.id}-${index + 1}`,
    filename: `${location.name}旅行照片 ${index + 1}`,
    url,
    sortOrder: index,
    bundled: true,
  }));
  return { ...location, photos: [...localPhotos, ...location.photos] };
}

const pinPositions: Record<string, { left: string; top: string }> = {
  "hong-kong": { left: "34%", top: "15%" },
  japan: { left: "74%", top: "15%" },
  thailand: { left: "25%", top: "39%" },
  vanuatu: { left: "62%", top: "43%" },
  sydney: { left: "42%", top: "76%" },
  "new-zealand": { left: "82%", top: "69%" },
};

const routeSegments = [
  { className: "route-a", label: "悉尼到瓦努阿图" },
  { className: "route-b", label: "瓦努阿图到新西兰" },
  { className: "route-c", label: "新西兰到日本" },
  { className: "route-d", label: "日本到泰国" },
  { className: "route-e", label: "泰国到香港" },
];

function apiError(payload: unknown, fallback: string) {
  return typeof payload === "object" && payload && "error" in payload ? String((payload as { error: unknown }).error) : fallback;
}

export function JourneyExperience() {
  const [envelopeOpened, setEnvelopeOpened] = useState(false);
  const [entered, setEntered] = useState(false);
  const [nextStopOpen, setNextStopOpen] = useState(false);
  const [locations, setLocations] = useState(() => fallbackLocations.map(addBundledPhotos));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [zoomId, setZoomId] = useState<string | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [adminOpen, setAdminOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [draftDescription, setDraftDescription] = useState("");
  const touchStart = useRef<number | null>(null);

  const activeLocation = useMemo(() => locations.find((location) => location.id === activeId) ?? null, [activeId, locations]);
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/journey", { cache: "no-store" });
      const payload = (await response.json()) as { locations?: Location[] };
      if (response.ok && payload.locations) setLocations(payload.locations.map(addBundledPhotos));
    } catch {
      setNotice("相册正在准备中，旅行地图仍然可以浏览。");
    }
  }, []);

  useEffect(() => {
    refresh();
    fetch("/api/admin/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { admin?: boolean }) => setIsAdmin(Boolean(payload.admin)))
      .catch(() => undefined);
  }, [refresh]);

  useEffect(() => {
    if (activeLocation) {
      setPhotoIndex(0);
      setDraftDescription(activeLocation.description);
    }
  }, [activeLocation?.id]);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (nextStopOpen) setNextStopOpen(false);
        else if (activeId) {
          setActiveId(null);
          setZoomId(null);
        }
        else if (adminOpen) setAdminOpen(false);
      }
      if (!activeLocation?.photos.length) return;
      if (event.key === "ArrowRight") setPhotoIndex((index) => (index + 1) % activeLocation.photos.length);
      if (event.key === "ArrowLeft") setPhotoIndex((index) => (index - 1 + activeLocation.photos.length) % activeLocation.photos.length);
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [activeId, activeLocation, adminOpen, nextStopOpen]);

  const openLocation = (id: string) => {
    setNotice("");
    setZoomId(id);
    window.setTimeout(() => setActiveId(id), 320);
  };

  const closeAlbum = () => {
    setActiveId(null);
    window.setTimeout(() => setZoomId(null), 120);
  };

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: form.get("password") }),
    });
    const payload = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return setNotice(apiError(payload, "无法解锁管理模式"));
    setIsAdmin(true);
    setAdminOpen(false);
    setNotice("管理模式已解锁");
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAdmin(false);
    setNotice("已退出管理模式");
  }

  function upload(files: FileList | null) {
    if (!files?.length || !activeLocation) return;
    const form = new FormData();
    form.set("locationId", activeLocation.id);
    Array.from(files).forEach((file) => form.append("files", file));
    setUploadProgress(0);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) setUploadProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = async () => {
      setUploadProgress(null);
      const payload = JSON.parse(xhr.responseText || "{}");
      if (xhr.status < 200 || xhr.status >= 300) return setNotice(apiError(payload, "上传失败"));
      setNotice(`已放入 ${payload.uploaded} 张旅行照片`);
      await refresh();
    };
    xhr.onerror = () => {
      setUploadProgress(null);
      setNotice("上传中断，请检查网络后重试");
    };
    xhr.send(form);
  }

  async function saveDescription() {
    if (!activeLocation) return;
    setLoading(true);
    const response = await fetch(`/api/admin/location/${activeLocation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: draftDescription }),
    });
    const payload = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) return setNotice(apiError(payload, "保存失败"));
    setNotice("纪念文字已保存");
    await refresh();
  }

  async function deletePhoto(photo: Photo) {
    if (!window.confirm(`确定删除“${photo.filename}”吗？删除后无法恢复。`)) return;
    const response = await fetch(`/api/admin/photo/${photo.id}`, { method: "DELETE" });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return setNotice(apiError(payload, "删除失败"));
    setNotice("照片已删除");
    setPhotoIndex(0);
    await refresh();
  }

  async function movePhoto(index: number, direction: -1 | 1) {
    if (!activeLocation) return;
    const editablePhotos = activeLocation.photos.filter((photo) => !photo.bundled);
    const target = index + direction;
    if (target < 0 || target >= editablePhotos.length) return;
    const ids = editablePhotos.map((photo) => photo.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    const response = await fetch("/api/admin/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locationId: activeLocation.id, photoIds: ids }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return setNotice(apiError(payload, "排序失败"));
    setPhotoIndex(activeLocation.photos.findIndex((photo) => photo.id === ids[target]));
    await refresh();
  }

  return (
    <main className={`experience ${entered ? "is-entered" : ""}`}>
      <section className={`invitation-screen ${envelopeOpened ? "envelope-opened" : ""}`} aria-hidden={entered}>
        <button className="envelope-scene" onClick={() => setEnvelopeOpened(true)} aria-label="打开严明曦的生日来信">
          <span className="envelope-shadow" aria-hidden="true" />
          <span className="envelope">
            <span className="envelope-back" />
            <span className="envelope-letter-peek">YOU&apos;RE INVITED</span>
            <span className="envelope-front" />
            <span className="envelope-flap" />
          </span>
          <strong>严明曦 · 五岁生日来信</strong>
          <small>轻轻点一下，打开信封</small>
        </button>
        <div className="invitation-card">
          <div className="invite-copy">
            <span className="eyebrow">YOU&apos;RE INVITED · 生日邀请</span>
            <p className="tiny-stars" aria-hidden="true">✦　✧　✦</p>
            <h1><span>严明曦</span> 五岁啦！</h1>
            <p className="invite-lead">欢迎来参加我的生日派对</p>
            <div className="invite-details">
              <p><span>日期</span><strong>8月19日</strong></p>
              <i aria-hidden="true">★</i>
              <p><span>地点</span><strong>寿司宋</strong></p>
            </div>
            <p className="wish">每天开心一点点</p>
            <button className="journey-button" onClick={() => setEntered(true)}>
              开启我们的星星旅程 <span aria-hidden="true">➜</span>
            </button>
            <p className="from">FROM · 严明曦</p>
          </div>
        </div>
      </section>

      <section className="map-screen" aria-hidden={!entered}>
        <header className="map-header">
          <div>
            <span className="eyebrow">MINGXI&apos;S LITTLE WORLD TOUR</span>
            <h2>我们的星星旅行地图</h2>
            <p>从悉尼出发，沿着六颗小星星，一起翻开去过的地方。</p>
          </div>
          <div className="map-actions">
            <span className="stop-count">6 STOPS · 6 站</span>
            <button className="next-stop-trigger" onClick={() => setNextStopOpen(true)}>
              下一站 <span aria-hidden="true">✦</span>
            </button>
            {isAdmin && <button className="small-button" onClick={logout}>退出管理</button>}
          </div>
        </header>

        <div className="map-shell">
          <div
            className={`map-canvas ${zoomId ? "is-zoomed" : ""}`}
            style={{ transformOrigin: zoomId ? `${pinPositions[zoomId].left} ${pinPositions[zoomId].top}` : "center" }}
            aria-label="从悉尼到香港的六站旅行地图"
          >
            <div className="route-lines" aria-hidden="true">
              {routeSegments.map((segment, index) => <span key={segment.className} className={segment.className} style={{ animationDelay: `${index * 0.4 + 0.3}s` }} />)}
            </div>
            {locations.map((location) => (
              <button
                key={location.id}
                className={`map-pin pin-${location.id}`}
                style={pinPositions[location.id]}
                onClick={() => openLocation(location.id)}
                aria-label={`第${location.stopOrder}站 ${location.name}，${location.photos.length}张照片`}
              >
                <span className="pin-star" aria-hidden="true"><b>{location.stopOrder}</b></span>
                <span className="pin-label"><strong>{location.name}</strong><small>{location.photos.length ? `${location.photos.length} 张照片` : "等待放入照片"}</small></span>
              </button>
            ))}
          </div>
        </div>

        <div className="journey-strip" aria-label="旅行顺序">
          {locations.map((location, index) => (
            <button key={location.id} onClick={() => openLocation(location.id)}>
              <span>{String(index + 1).padStart(2, "0")}</span>{location.name}
            </button>
          ))}
        </div>
        <p className="map-footer">星星人希望你每天开心一点点</p>
        <button className="admin-peek" onClick={() => setAdminOpen(true)} aria-label="打开相册管理">✦</button>
      </section>

      {notice && <button className="toast" onClick={() => setNotice("")} aria-live="polite">{notice}</button>}

      {nextStopOpen && (
        <div className="overlay next-stop-overlay" role="dialog" aria-modal="true" aria-labelledby="next-stop-title" onMouseDown={(event) => event.target === event.currentTarget && setNextStopOpen(false)}>
          <section className="next-stop-popup">
            <button className="close-button" onClick={() => setNextStopOpen(false)} aria-label="关闭下一站卡片">×</button>
            <div className="next-stop-popup-art">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/characters/next-stop-party-v2.png" alt="两位星星人带着爱心气球，准备一起前往下一站" />
            </div>
            <p aria-hidden="true">✦　♡　✦</p>
            <h3 id="next-stop-title">一起去下一站叭~</h3>
          </section>
        </div>
      )}

      {adminOpen && !isAdmin && (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="admin-title" onMouseDown={(event) => event.target === event.currentTarget && setAdminOpen(false)}>
          <form className="login-card" onSubmit={login}>
            <button type="button" className="close-button" onClick={() => setAdminOpen(false)} aria-label="关闭">×</button>
            <span className="dialog-icon" aria-hidden="true">✦</span>
            <p className="eyebrow">PRIVATE EDITING</p>
            <h3 id="admin-title">管理旅行相册</h3>
            <p>访客可以自由浏览，输入管理口令后才能添加或整理照片。</p>
            <label>管理口令<input name="password" type="password" autoComplete="current-password" required autoFocus /></label>
            <button className="journey-button" disabled={loading}>{loading ? "正在验证…" : "解锁管理模式"}</button>
          </form>
        </div>
      )}

      {activeLocation && (
        <div className="overlay album-overlay" role="dialog" aria-modal="true" aria-labelledby="album-title" onMouseDown={(event) => event.target === event.currentTarget && closeAlbum()}>
          <article className="album-card">
            <button className="close-button" onClick={closeAlbum} aria-label="关闭相册">×</button>
            <header className="album-heading">
              <span className="stop-badge">STOP {String(activeLocation.stopOrder).padStart(2, "0")}</span>
              <div><h3 id="album-title">{activeLocation.name}</h3><p>{activeLocation.subtitle}</p></div>
              <span className="photo-total">{activeLocation.photos.length}<small>PHOTOS</small></span>
            </header>

            <div
              className="photo-stage"
              onTouchStart={(event) => (touchStart.current = event.touches[0].clientX)}
              onTouchEnd={(event) => {
                if (touchStart.current === null || !activeLocation.photos.length) return;
                const delta = event.changedTouches[0].clientX - touchStart.current;
                if (Math.abs(delta) > 45) setPhotoIndex((index) => delta < 0 ? (index + 1) % activeLocation.photos.length : (index - 1 + activeLocation.photos.length) % activeLocation.photos.length);
                touchStart.current = null;
              }}
            >
              {activeLocation.photos.length ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="polaroid-photo" src={activeLocation.photos[photoIndex]?.url} alt={`${activeLocation.name}旅行照片 ${photoIndex + 1}`} loading="lazy" />
                  {activeLocation.photos.length > 1 && <>
                    <button className="photo-arrow prev" onClick={() => setPhotoIndex((photoIndex - 1 + activeLocation.photos.length) % activeLocation.photos.length)} aria-label="上一张">‹</button>
                    <button className="photo-arrow next" onClick={() => setPhotoIndex((photoIndex + 1) % activeLocation.photos.length)} aria-label="下一张">›</button>
                  </>}
                  <span className="photo-counter">{photoIndex + 1} / {activeLocation.photos.length}</span>
                </>
              ) : (
                <div className="empty-album"><span aria-hidden="true">☆</span><strong>这一站的照片盒还空着</strong><p>{isAdmin ? "选择几张喜欢的旅行照片放进来吧。" : "回忆正在整理，很快就会亮起来。"}</p></div>
              )}
            </div>

            {activeLocation.photos.length > 1 && (
              <div className="thumbnails" aria-label="旅行手帐照片缩略图">
                {activeLocation.photos.map((photo, index) => (
                  <button key={photo.id} className={index === photoIndex ? "active" : ""} onClick={() => setPhotoIndex(index)} aria-label={`查看第${index + 1}张`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            <div className="memory-note"><span aria-hidden="true">✦</span><p>{activeLocation.description}</p></div>

            {isAdmin && (
              <section className="admin-tools" aria-label="相册管理工具">
                <h4>整理这一站</h4>
                <label className="upload-button">
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => { upload(event.target.files); event.target.value = ""; }} />
                  ＋ 添加照片 <small>JPG / PNG / WEBP · 每张不超过 10 MB</small>
                </label>
                {uploadProgress !== null && <div className="progress"><span style={{ width: `${uploadProgress}%` }} /><b>{uploadProgress}%</b></div>}
                <label className="description-editor">纪念文字<textarea value={draftDescription} maxLength={240} onChange={(event) => setDraftDescription(event.target.value)} /><button onClick={saveDescription} disabled={loading}>保存文字</button></label>
                {activeLocation.photos.some((photo) => !photo.bundled) && (
                  <div className="photo-admin-list">
                    {activeLocation.photos.filter((photo) => !photo.bundled).map((photo, index, editablePhotos) => (
                      <div key={photo.id}>
                        <span>{index + 1}</span><p title={photo.filename}>{photo.filename}</p>
                        <button onClick={() => movePhoto(index, -1)} disabled={index === 0} aria-label="向前移动">←</button>
                        <button onClick={() => movePhoto(index, 1)} disabled={index === editablePhotos.length - 1} aria-label="向后移动">→</button>
                        <button className="delete" onClick={() => deletePhoto(photo)}>删除</button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </article>
        </div>
      )}
    </main>
  );
}
