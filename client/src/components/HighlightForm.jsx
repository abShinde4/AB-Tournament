import { useState } from "react";
import "./HighlightForm.css";

const HighlightForm = ({ results, onSubmit, isLoading, initialData = null, onCancel }) => {
  const [formData, setFormData] = useState({
    resultId: initialData?.result?._id || "",
    matchId: initialData?.match?._id || "",
    userId: initialData?.user?._id || "",
    winnerName: initialData?.winnerName || "",
    teamName: initialData?.teamName || "",
    prizeAmount: initialData?.prizeAmount || "",
    matchType: initialData?.matchType || "",
    map: initialData?.map || "",
    youtubeUrl: initialData?.youtubeUrl || "",
    instagramUrl: initialData?.instagramUrl || "",
    thumbnailUrl: initialData?.thumbnailUrl || "",
    description: initialData?.description || "",
  });

  const [errors, setErrors] = useState({});

  const isValidUrl = (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  const isValidYouTubeUrl = (value) => {
    if (!isValidUrl(value)) return false;
    const url = new URL(value.trim());
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    const path = url.pathname;
    if (host === "youtu.be") {
      return path.length > 1;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      return (
        path.startsWith("/shorts/") ||
        (path === "/watch" && url.searchParams.get("v")) ||
        path.startsWith("/embed/")
      );
    }
    return false;
  };

  const isValidInstagramReelUrl = (value) => {
    if (!isValidUrl(value)) return false;
    const url = new URL(value.trim());
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    const path = url.pathname.toLowerCase();
    return host === "instagram.com" && path.startsWith("/reel/");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name] || errors.selection) {
      setErrors((prev) => ({ ...prev, [name]: null, selection: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const trimmedYouTubeUrl = formData.youtubeUrl.trim();
    const trimmedInstagramUrl = formData.instagramUrl.trim();
    const trimmedThumbnailUrl = formData.thumbnailUrl.trim();
    const numericPrizeAmount = Number(formData.prizeAmount);

    if (!formData.resultId && !formData.winnerName.trim()) {
      newErrors.selection = "Select a winner or enter a winner name.";
    }

    if (formData.prizeAmount !== "" && !Number.isFinite(numericPrizeAmount)) {
      newErrors.prizeAmount = "Prize amount must be a valid number.";
    }
    if (formData.prizeAmount !== "" && numericPrizeAmount < 0) {
      newErrors.prizeAmount = "Prize amount cannot be negative.";
    }

    if (trimmedYouTubeUrl && !isValidYouTubeUrl(trimmedYouTubeUrl)) {
      newErrors.youtubeUrl = "Invalid YouTube URL. Use youtube.com/watch?v=, youtube.com/shorts/, or youtu.be/.";
    }

    if (trimmedInstagramUrl && !isValidInstagramReelUrl(trimmedInstagramUrl)) {
      newErrors.instagramUrl = "Invalid Instagram Reel URL. Use instagram.com/reel/...";
    }

    if (trimmedThumbnailUrl && !isValidUrl(trimmedThumbnailUrl)) {
      newErrors.thumbnailUrl = "Invalid thumbnail URL.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      const trimmedYouTubeUrl = formData.youtubeUrl.trim();
      const trimmedInstagramUrl = formData.instagramUrl.trim();
      const trimmedThumbnailUrl = formData.thumbnailUrl.trim();
      const trimmedDescription = formData.description.trim();

      const payload = {
        resultId: formData.resultId || undefined,
        matchId: formData.matchId || undefined,
        userId: formData.userId || undefined,
        winnerName: formData.winnerName.trim() || undefined,
        teamName: formData.teamName.trim() || undefined,
        prizeAmount:
          formData.prizeAmount === "" || formData.prizeAmount === null
            ? undefined
            : Number(formData.prizeAmount),
        matchType: formData.matchType.trim() || undefined,
        map: formData.map.trim() || undefined,
        youtubeUrl: trimmedYouTubeUrl || undefined,
        instagramUrl: trimmedInstagramUrl || undefined,
        thumbnailUrl: trimmedThumbnailUrl || undefined,
        description: trimmedDescription || undefined,
      };
      onSubmit(payload);
    }
  };

  return (
    <form className="highlight-form" onSubmit={handleSubmit}>
      <h3>Add Winner Highlight</h3>

      {/* Winner Selection */}
      <div className="form-group">
        <label htmlFor="resultId">Select Winner</label>
        <select
          id="resultId"
          name="resultId"
          value={formData.resultId}
          onChange={(e) => {
            const selected = results.find((r) => r._id === e.target.value);
            handleChange(e);
            setFormData((prev) => ({
              ...prev,
              matchId: selected?.match?._id || "",
              userId: selected?.user?._id || "",
            }));
          }}
          className={errors.selection ? "error" : ""}
        >
          <option value="">Choose a winner...</option>
          {results.map((result) => (
            <option key={result._id} value={result._id}>
              {result.user?.username || "Unknown"} - {result.match?.title || "Unknown Match"} (Rank #{result.rank})
            </option>
          ))}
        </select>
        <small>Optional if you enter the winner name below.</small>
      </div>

      {/* Winner Name */}
      <div className="form-group">
        <label htmlFor="winnerName">Winner Name</label>
        <input
          type="text"
          id="winnerName"
          name="winnerName"
          value={formData.winnerName}
          onChange={handleChange}
          placeholder="e.g., Shreyash"
          className={errors.selection ? "error" : ""}
        />
        {errors.selection && <span className="error-text">{errors.selection}</span>}
      </div>

      {/* Team Name */}
      <div className="form-group">
        <label htmlFor="teamName">
          Team Name <span className="optional">(optional)</span>
        </label>
        <input
          type="text"
          id="teamName"
          name="teamName"
          value={formData.teamName}
          onChange={handleChange}
          placeholder="e.g., Phoenix Squad"
          className={errors.teamName ? "error" : ""}
        />
        {errors.teamName && <span className="error-text">{errors.teamName}</span>}
      </div>

      {/* Prize Amount */}
      <div className="form-group">
        <label htmlFor="prizeAmount">
          Prize Amount (₹) <span className="optional">(optional)</span>
        </label>
        <input
          type="number"
          id="prizeAmount"
          name="prizeAmount"
          value={formData.prizeAmount}
          onChange={handleChange}
          placeholder="e.g., 5000"
          min="0"
          className={errors.prizeAmount ? "error" : ""}
        />
        {errors.prizeAmount && <span className="error-text">{errors.prizeAmount}</span>}
      </div>

      {/* Match Type */}
      <div className="form-group">
        <label htmlFor="matchType">
          Match Type <span className="optional">(optional)</span>
        </label>
        <input
          type="text"
          id="matchType"
          name="matchType"
          value={formData.matchType}
          onChange={handleChange}
          placeholder="e.g., Squad"
          className={errors.matchType ? "error" : ""}
        />
        {errors.matchType && <span className="error-text">{errors.matchType}</span>}
      </div>

      {/* Map */}
      <div className="form-group">
        <label htmlFor="map">
          Map <span className="optional">(optional)</span>
        </label>
        <input
          type="text"
          id="map"
          name="map"
          value={formData.map}
          onChange={handleChange}
          placeholder="e.g., Erangel"
          className={errors.map ? "error" : ""}
        />
        {errors.map && <span className="error-text">{errors.map}</span>}
      </div>

      {/* YouTube URL */}
      <div className="form-group">
        <label htmlFor="youtubeUrl">
          YouTube URL <span className="optional">(optional)</span>
        </label>
        <input
          type="text"
          id="youtubeUrl"
          name="youtubeUrl"
          value={formData.youtubeUrl}
          onChange={handleChange}
          placeholder="https://youtube.com/watch?v/... or https://youtube.com/shorts/..."
          className={errors.youtubeUrl ? "error" : ""}
        />
        {errors.youtubeUrl && <span className="error-text">{errors.youtubeUrl}</span>}
      </div>

      {/* Instagram URL */}
      <div className="form-group">
        <label htmlFor="instagramUrl">
          Instagram Reel URL <span className="optional">(optional)</span>
        </label>
        <input
          type="text"
          id="instagramUrl"
          name="instagramUrl"
          value={formData.instagramUrl}
          onChange={handleChange}
          placeholder="https://instagram.com/reel/..."
          className={errors.instagramUrl ? "error" : ""}
        />
        {errors.instagramUrl && <span className="error-text">{errors.instagramUrl}</span>}
      </div>

      {/* Thumbnail URL */}
      <div className="form-group">
        <label htmlFor="thumbnailUrl">
          Thumbnail URL <span className="optional">(optional)</span>
        </label>
        <input
          type="text"
          id="thumbnailUrl"
          name="thumbnailUrl"
          value={formData.thumbnailUrl}
          onChange={handleChange}
          placeholder="https://example.com/thumbnail.jpg"
          className={errors.thumbnailUrl ? "error" : ""}
        />
        {errors.thumbnailUrl && <span className="error-text">{errors.thumbnailUrl}</span>}
        <small>If not provided, YouTube thumbnail will be auto-generated when available.</small>
      </div>

      {/* Description */}
      <div className="form-group">
        <label htmlFor="description">
          Description <span className="optional">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Add spotlight details or notes..."
          className={errors.description ? "error" : ""}
          rows="4"
        />
        {errors.description && <span className="error-text">{errors.description}</span>}
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Highlight"}
        </button>
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default HighlightForm;
